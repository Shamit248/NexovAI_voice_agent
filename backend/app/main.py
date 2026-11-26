import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import init_db
from app.routes.doctors import router as doctors_router
from app.routes.appointments import router as appointments_router
from app.routes.call import router as call_router

# Initialize database tables & seed data on startup
init_db()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FDE Clinical Voice AI Doctor Appointment Booking Agent with Pipecat, ElevenLabs, Gemini & Real-time Dashboard"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(call_router)

# Mount frontend build static directory if built
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def index():
        return {
            "name": settings.APP_NAME,
            "status": "ready",
            "docs": "/docs",
            "endpoints": {
                "doctors": "/api/doctors",
                "slots": "/api/slots",
                "appointments": "/api/appointments",
                "voice_call_ws": "/ws/call",
                "dashboard_ws": "/ws/dashboard",
                "status": "/api/status"
            }
        }
