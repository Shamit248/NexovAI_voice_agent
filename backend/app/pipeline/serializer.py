import json
from loguru import logger
from pipecat.serializers.base_serializer import FrameSerializer
from pipecat.frames.frames import (
    Frame,
    InputAudioRawFrame,
    OutputAudioRawFrame,
    InputTransportMessageFrame,
    TranscriptionFrame,
    TextFrame
)

class WebSocketAudioSerializer(FrameSerializer):
    """
    Serializer for WebSocket communication with browser.
    - Incoming binary bytes -> InputAudioRawFrame (16kHz PCM audio)
    - Incoming JSON string -> text control or client message
    - Outgoing OutputAudioRawFrame -> raw binary PCM audio bytes to speaker
    """
    
    def __init__(self, sample_rate: int = 16000, **kwargs):
        super().__init__(**kwargs)
        self._target_sample_rate = sample_rate

    async def serialize(self, frame: Frame) -> str | bytes | None:
        """Convert a frame into wire format for WebSocket transmission."""
        if isinstance(frame, OutputAudioRawFrame):
            # Send raw audio bytes directly to the browser
            return frame.audio
        return None

    async def deserialize(self, data: str | bytes) -> Frame | None:
        """Convert data from the WebSocket wire into a Pipecat Frame."""
        if isinstance(data, bytes):
            # Incoming microphone audio chunk (16-bit PCM mono 16kHz)
            return InputAudioRawFrame(
                audio=data,
                sample_rate=self._target_sample_rate,
                num_channels=1
            )
        elif isinstance(data, str):
            try:
                payload = json.loads(data)
                # Client control messages e.g. {"type": "ping"} or text fallback
                if payload.get("type") == "user_text":
                    text = payload.get("text", "")
                    if text:
                        return TranscriptionFrame(
                            text=text,
                            user_id="caller",
                            timestamp=""
                        )
                return InputTransportMessageFrame(message=payload)
            except Exception as e:
                logger.warning(f"Failed to parse text message: {e}")
        return None
