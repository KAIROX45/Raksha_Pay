"""
RakshaPay Backend API Gateway
AI-Powered Smart Payment Security & Fraud Prevention Platform
"""
import sys
import os

# Ensure project root (containing ml/) and backend/ are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered

# Import routers
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.accounts import router as accounts_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.recipients import router as recipients_router
from app.api.v1.fraud import router as fraud_router
from app.api.v1.gemini import router as gemini_router
from app.api.v1.admin import router as admin_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.analyze import router as analyze_router

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)
logger.info("Database schema initialized successfully.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RakshaPay — AI-Powered Smart Payment Security & Fraud Prevention Platform. High-security simulated digital payment platform combining machine learning, rule-based fraud detection, and Google Gemini AI.",
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server & production client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
api_v1_str = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_str)
app.include_router(users_router, prefix=api_v1_str)
app.include_router(accounts_router, prefix=api_v1_str)
app.include_router(transactions_router, prefix=api_v1_str)
app.include_router(recipients_router, prefix=api_v1_str)
app.include_router(fraud_router, prefix=api_v1_str)
app.include_router(gemini_router, prefix=api_v1_str)
app.include_router(admin_router, prefix=api_v1_str)
app.include_router(wallet_router, prefix=api_v1_str)
app.include_router(wallet_router)  # Also mount at /wallet for direct access
app.include_router(analyze_router, prefix=api_v1_str)
app.include_router(analyze_router)  # Also mount at /analyze-transaction for direct access

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/api/docs",
        "simulation_disclaimer": "Simulated UPI Network for Cyber Safety & Fraud Demonstration Only.",
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "fraud_engine": "operational",
        "gemini_service": "configured" if settings.GEMINI_API_KEY else "offline_fallback_mode",
        "is_simulated": True,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
