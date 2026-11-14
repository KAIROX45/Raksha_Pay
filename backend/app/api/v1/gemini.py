from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.ai import (
    ExplainFraudRequest,
    ExplainFraudResponse,
    ScamAnalyzeRequest,
    ScamAnalyzeResponse,
    AIChatRequest,
    AIChatResponse,
)
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["Google Gemini AI"])

@router.post("/explain-fraud", response_model=ExplainFraudResponse)
def explain_fraud(
    payload: ExplainFraudRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Feature 1: Gemini AI explains why a transaction was flagged or blocked
    using only verified telemetry risk signals.
    """
    result = gemini_service.explain_fraud(
        recipient_upi_id=payload.recipient_upi_id,
        amount_rupees=payload.amount_rupees,
        risk_score=payload.risk_score,
        detection_signals=payload.detection_signals,
    )
    return result

@router.post("/analyze-scam", response_model=ScamAnalyzeResponse)
def analyze_scam(
    payload: ScamAnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Feature 2: Scam Message Analyzer.
    Analyzes pasted SMS, WhatsApp message, or UPI collect note for phishing/fraud indicators.
    """
    result = gemini_service.analyze_scam_message(payload.message_text)
    return result

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Feature 3: Conversational AI Security Assistant.
    Provides verified payment security education tailored to the authenticated user.
    """
    user_context = {
        "full_name": current_user.full_name,
        "phone": current_user.phone,
    }
    msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
    reply = gemini_service.chat_assistant(msgs, user_context=user_context)
    return {
        "reply": reply,
        "model": gemini_service.model_name if gemini_service.is_available() else "RakshaPay Builtin Safety KnowledgeBase",
    }
