from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "RakshaPay"
    PROJECT_TAGLINE: str = "Pay Smart. Stay Protected."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Environment & Security
    ENV: str = "development"
    SECRET_KEY: str = "rakshapay-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    # Defaults to local SQLite for instant zero-dependency testing, or PostgreSQL connection string
    DATABASE_URL: str = Field(default="sqlite:///./rakshapay.db")

    # Firebase Authentication
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None

    # Google Gemini AI
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Fraud Detection Thresholds (0-100 scale)
    # 0-29: Low Risk (Auto-Approved)
    # 30-69: Medium Risk (Held for Verification / Pending)
    # 70-100: High Risk (Blocked)
    FRAUD_LOW_THRESHOLD: int = 30
    FRAUD_HIGH_THRESHOLD: int = 70

    # Large amount threshold for automatic scrutiny (in INR rupees)
    HIGH_VALUE_THRESHOLD_RUPEES: float = 50000.0
    VELOCITY_WINDOW_SECONDS: int = 60
    VELOCITY_MAX_TX_COUNT: int = 3

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
