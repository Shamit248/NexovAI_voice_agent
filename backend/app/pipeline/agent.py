import asyncio
import json
from datetime import datetime
from loguru import logger
from fastapi import WebSocket

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.processors.audio.vad_processor import VADProcessor
from pipecat.services.elevenlabs.stt import ElevenLabsRealtimeSTTService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.adapters.llm.schemas.function_schema import FunctionSchema
from pipecat.adapters.llm.schemas.tools_schema import ToolsSchema
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.frames.frames import (
    Frame,
    TranscriptionFrame,
    TextFrame,
    TTSSpeakFrame,
    FunctionCallsStartedFrame,
    FunctionCallInProgressFrame,
    FunctionCallResultFrame,
    LLMFullResponseEndFrame,
    EndFrame
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
from pipecat.transports.websocket.fastapi import FastAPIWebsocketTransport, FastAPIWebsocketParams

from app.config import settings
from app.pipeline.prompts import CLINICAL_AGENT_SYSTEM_PROMPT, INITIAL_GREETING
from app.pipeline.tools import (
    check_doctor_availability_handler,
    book_appointment_handler,
    cancel_appointment_handler
)
from app.pipeline.serializer import WebSocketAudioSerializer


class TranscriptEventBroadcaster(FrameProcessor):
    """
    Frame processor to broadcast live conversation events, transcripts,
    and tool execution states to the connected frontend client.
    """
    def __init__(self, websocket: WebSocket, **kwargs):
        super().__init__(**kwargs)
        self._websocket = websocket
        self._current_agent_response = []

    async def _safe_send_json(self, payload: dict):
        try:
            await self._websocket.send_json(payload)
        except Exception as e:
            logger.debug(f"Could not send JSON event to websocket: {e}")

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        # 1. Caller Speech Transcription from STT
        if isinstance(frame, TranscriptionFrame):
            text = frame.text.strip()
            if text:
                logger.info(f"[Caller Spoke]: {text}")
                await self._safe_send_json({
                    "type": "transcript",
                    "role": "caller",
                    "text": text,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
                await self._safe_send_json({
                    "type": "status",
                    "status": "thinking"
                })

        # 2. Tool Calls Started
        elif isinstance(frame, FunctionCallsStartedFrame):
            await self._safe_send_json({
                "type": "action",
                "status": "executing_tool",
                "message": "Nexa is checking clinic records..."
            })

        # 3. Agent Streaming Text Frames
        elif isinstance(frame, TextFrame):
            text = frame.text
            if text:
                self._current_agent_response.append(text)
                await self._safe_send_json({
                    "type": "status",
                    "status": "speaking"
                })

        # 4. Agent Spoken Turn Ended
        elif isinstance(frame, LLMFullResponseEndFrame):
            full_text = "".join(self._current_agent_response).strip()
            self._current_agent_response = []
            if full_text:
                logger.info(f"[Agent Spoke]: {full_text}")
                await self._safe_send_json({
                    "type": "transcript",
                    "role": "agent",
                    "text": full_text,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
                await self._safe_send_json({
                    "type": "status",
                    "status": "listening"
                })

        await self.push_frame(frame, direction)


async def run_pipecat_voice_pipeline(websocket: WebSocket):
    """
    Build and execute the live Pipecat voice pipeline:
    Caller Audio (WS) -> Silero VAD -> ElevenLabs STT -> LLM Context (Gemini) -> ElevenLabs TTS -> Audio (WS)
    """
    logger.info("Initializing Pipecat Voice Pipeline with ElevenLabs and Gemini...")

    # 1. Setup transport with audio serializer
    serializer = WebSocketAudioSerializer(sample_rate=settings.SAMPLE_RATE)
    transport_params = FastAPIWebsocketParams(
        audio_in_enabled=True,
        audio_in_sample_rate=settings.SAMPLE_RATE,
        audio_in_channels=1,
        audio_out_enabled=True,
        audio_out_sample_rate=settings.SAMPLE_RATE,
        audio_out_channels=1,
        serializer=serializer
    )
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=transport_params
    )

    # 2. Setup VAD (Bonus: Silero VAD with tuned conversational pause threshold)
    from pipecat.audio.vad.vad_analyzer import VADParams
    vad_analyzer = SileroVADAnalyzer(
        sample_rate=settings.SAMPLE_RATE,
        params=VADParams(
            confidence=0.7,
            start_secs=0.2,
            stop_secs=0.8,  # 800ms natural conversational pause before concluding caller finished speaking
            min_volume=0.6
        )
    )
    vad_processor = VADProcessor(vad_analyzer=vad_analyzer)

    # 3. Setup STT (ElevenLabs Realtime STT)
    stt = ElevenLabsRealtimeSTTService(
        api_key=settings.ELEVENLABS_API_KEY,
        sample_rate=settings.SAMPLE_RATE
    )

    # 4. Setup Function Calling Tools
    s_avail = FunctionSchema(
        name="check_doctor_availability",
        description="Returns the available slots for a doctor and/or date so the agent can offer them to the caller.",
        properties={
            "doctor_name": {"type": "string", "description": "Doctor's name, e.g. Dr. Sarah Chen"},
            "specialty": {"type": "string", "description": "Specialty such as Cardiology, Dermatology, Pediatrics"},
            "date": {"type": "string", "description": "Date, e.g. Today, Tomorrow"}
        },
        required=[],
        handler=check_doctor_availability_handler
    )
    s_book = FunctionSchema(
        name="book_appointment",
        description="Books a selected slot for the caller, using the phone number the caller told the agent.",
        properties={
            "phone_number": {"type": "string", "description": "Spoken phone number of the patient"},
            "doctor_name": {"type": "string", "description": "Name of doctor to book"},
            "slot_time": {"type": "string", "description": "Time slot, e.g. 09:30 AM, 02:30 PM"},
            "date": {"type": "string", "description": "Date of appointment"}
        },
        required=["phone_number", "doctor_name", "slot_time"],
        handler=book_appointment_handler
    )
    s_cancel = FunctionSchema(
        name="cancel_appointment",
        description="Cancels the caller's existing appointment, found using the phone number the caller told the agent.",
        properties={
            "phone_number": {"type": "string", "description": "Spoken phone number of caller to locate appointment"},
            "doctor_name": {"type": "string", "description": "Doctor's name if specified"},
            "slot_time": {"type": "string", "description": "Slot time if specified"}
        },
        required=["phone_number"],
        handler=cancel_appointment_handler
    )
    tools_schema = ToolsSchema(standard_tools=[s_avail, s_book, s_cancel])

    # 5. Setup LLM Context & Gemini LLM Service
    llm_context = LLMContext(
        messages=[
            {"role": "system", "content": CLINICAL_AGENT_SYSTEM_PROMPT}
        ],
        tools=tools_schema
    )
    context_pair = LLMContextAggregatorPair(llm_context)

    llm_settings = GoogleLLMService.Settings(model=settings.GEMINI_MODEL)
    llm = GoogleLLMService(
        api_key=settings.GEMINI_API_KEY,
        settings=llm_settings
    )

    # 6. Setup TTS (ElevenLabs TTS with Rachel Voice)
    tts_settings = ElevenLabsTTSService.Settings(
        voice=settings.ELEVENLABS_VOICE_ID,
        model=settings.ELEVENLABS_MODEL
    )
    tts = ElevenLabsTTSService(
        api_key=settings.ELEVENLABS_API_KEY,
        settings=tts_settings
    )

    # 7. Transcript and Event Broadcaster
    broadcaster = TranscriptEventBroadcaster(websocket=websocket)

    # 8. Assemble Pipeline
    pipeline = Pipeline([
        transport.input(),        # 1. Audio stream from WebSocket
        vad_processor,            # 2. Silero Voice Activity Detection
        stt,                      # 3. ElevenLabs Speech-to-Text
        broadcaster,              # 4. Intercept transcripts & tool events for frontend UI
        context_pair.user(),      # 5. Aggregate user speech into LLM context
        llm,                      # 6. Google Gemini LLM with function calling
        tts,                      # 7. ElevenLabs Text-to-Speech
        transport.output(),       # 8. Output audio stream to WebSocket
        context_pair.assistant()  # 9. Aggregate assistant speech into LLM context
    ])

    task = PipelineTask(pipeline, params=PipelineParams(allow_interruptions=True))
    runner = PipelineRunner()

    # Initial spoken greeting
    await task.queue_frame(TTSSpeakFrame(text=INITIAL_GREETING))
    await websocket.send_json({
        "type": "transcript",
        "role": "agent",
        "text": INITIAL_GREETING,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    })

    logger.info("Pipecat Voice Pipeline running...")
    await runner.run(task)
