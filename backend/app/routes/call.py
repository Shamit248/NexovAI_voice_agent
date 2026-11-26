import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger
from app.config import settings
from app.routes.appointments import active_dashboard_connections
from app.database import list_doctors, list_slots, list_appointments
from app.pipeline.prompts import INITIAL_GREETING

router = APIRouter(tags=["voice_call"])

@router.get("/api/status")
def get_status():
    """Return pipeline system status, model configuration, and mode."""
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    has_eleven = bool(settings.ELEVENLABS_API_KEY and len(settings.ELEVENLABS_API_KEY) > 5)
    
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "mode": "live_pipecat" if (has_gemini and has_eleven) else "demo_simulation",
        "gemini_configured": has_gemini,
        "elevenlabs_configured": has_eleven,
        "llm_model": settings.GEMINI_MODEL,
        "voice_id": settings.ELEVENLABS_VOICE_ID,
        "sample_rate": settings.SAMPLE_RATE,
        "vad_engine": "Silero VAD"
    }

@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """Real-time event stream for the frontend dashboard."""
    await websocket.accept()
    active_dashboard_connections.add(websocket)
    logger.info("Frontend Dashboard connected to real-time sync stream.")
    
    try:
        # Send initial snapshot immediately upon connection
        await websocket.send_json({
            "type": "snapshot",
            "doctors": list_doctors(),
            "slots": list_slots(),
            "appointments": list_appointments()
        })
        
        while True:
            # Keep-alive ping/pong
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except (WebSocketDisconnect, Exception) as e:
        logger.debug(f"Dashboard websocket disconnected: {e}")
    finally:
        active_dashboard_connections.discard(websocket)


@router.websocket("/ws/call")
async def call_websocket(websocket: WebSocket):
    """
    Main voice call WebSocket for Pipecat pipeline or intelligent clinical simulator.
    Streams two-way audio, live transcripts, and function calling tool events.
    """
    await websocket.accept()
    logger.info("Voice call session initiated from browser.")

    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    has_eleven = bool(settings.ELEVENLABS_API_KEY and len(settings.ELEVENLABS_API_KEY) > 5)

    if has_gemini and has_eleven:
        # Run Full Live Pipecat Voice Pipeline
        await websocket.send_json({
            "type": "system_info",
            "mode": "live_pipecat",
            "engine": "Pipecat + ElevenLabs STT/TTS + Gemini LLM + Silero VAD",
            "message": "Connected to live Pipecat voice pipeline."
        })
        try:
            from app.pipeline.agent import run_pipecat_voice_pipeline
            await run_pipecat_voice_pipeline(websocket)
        except WebSocketDisconnect:
            logger.info("Call disconnected by user.")
        except Exception as e:
            logger.error(f"Error in Pipecat voice pipeline: {e}")
            await websocket.send_json({
                "type": "error",
                "message": f"Pipeline notice: {str(e)}"
            })
    else:
        # Run Simulator with Web Speech & WebAudio support
        logger.info("Running in Intelligent Clinical Simulator mode (keys pending in .env)")
        await websocket.send_json({
            "type": "system_info",
            "mode": "demo_simulation",
            "engine": "Nexov Clinical Voice Engine (Demo Mode)",
            "message": "Running clinical voice agent. Add GEMINI_API_KEY & ELEVENLABS_API_KEY to .env for cloud neural models."
        })
        from app.utils.simulator import ClinicalConversationSimulator
        simulator = ClinicalConversationSimulator(websocket)
        
        # Initial spoken greeting
        await asyncio.sleep(0.3)
        await simulator.speak(INITIAL_GREETING)
        
        try:
            while True:
                msg = await websocket.receive()
                if "text" in msg:
                    import json
                    data = json.loads(msg["text"])
                    if data.get("type") == "user_text":
                        await simulator.handle_user_utterance(data.get("text", ""))
                    elif data.get("type") == "ping":
                        await websocket.send_text("pong")
                elif "bytes" in msg:
                    # In simulator mode, raw audio chunks keep the audio connection active
                    pass
        except WebSocketDisconnect:
            logger.info("Simulator call closed by user.")
        except Exception as e:
            logger.error(f"Simulator exception: {e}")
