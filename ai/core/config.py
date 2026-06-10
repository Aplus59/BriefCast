import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = "briefcast"
    
    # APIs
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SERPAPI_API_KEY: str = os.getenv("SERPAPI_API_KEY", "")
    GUARDIAN_API_KEY: str = os.getenv("GUARDIAN_API_KEY", "test") # "test" works for limited non-commercial use
    
    # Storage
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "briefcast-audio-bucket")
    
    # Operation Mode
    MODE: str = os.getenv("MODE", "continuous")
    BACKFILL_DAYS: int = int(os.getenv("BACKFILL_DAYS", "30"))
    
    class Config:
        env_file = ".env"

settings = Settings()
