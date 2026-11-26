import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file from project root or backend dir
load_dotenv()

class Settings(BaseSettings):
    APP_NAME: str = "NexovAI Voice Clinical Agent"
    APP_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # AI & Voice credentials
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    
    # Default model settings
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Rachel (professional clinical voice)
    ELEVENLABS_MODEL: str = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5")
    
    # Audio parameters
    SAMPLE_RATE: int = 16000
    CHANNELS: int = 1
    
    # Database
    DATABASE_PATH: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "nexov_clinic.db")
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
