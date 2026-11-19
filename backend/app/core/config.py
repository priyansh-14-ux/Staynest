import os
from typing import List
from pydantic_settings import BaseSettings

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "hostel_management.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Staynest — Hostel Management System (HMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_jwt_key_hostel_mgmt_2026_super_secure_entropy_99")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # SQLite default for local zero-config, PostgreSQL ready via DATABASE_URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DEFAULT_DB_PATH}"
    )
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    UPLOAD_DIR: str = os.path.join(BACKEND_DIR, "uploads")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
