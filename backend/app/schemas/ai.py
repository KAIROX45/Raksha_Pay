from typing import Optional, List
from pydantic import BaseModel, Field

class ExplainFraudRequest(BaseModel):
    transaction_ref: Optional[str] = None
    recipient_upi_id: str
    amount_rupees: float
    risk_score: int
    detection_signals: List[str]

class ExplainFraudResponse(BaseModel):
    headline: str
    why_flagged: str
    what_to_be_careful_about: str
    recommended_action: str
    ai_disclaimer: str = "AI-assisted guidance based on real transaction telemetry. Not a formal banking liability guarantee."

class ScamAnalyzeRequest(BaseModel):
    message_text: str = Field(..., min_length=5, max_length=5000, description="Pasted SMS, WhatsApp payment request, or collect note")

class ScamAnalyzeResponse(BaseModel):
    risk_assessment: str  # HIGH_RISK, SUSPICIOUS, LIKELY_SAFE
    risk_score: int = Field(..., ge=0, le=100)
    suspicious_phrases: List[str] = []
    explanation: str
    safety_recommendations: List[str] = []
    is_simulated_ai: bool = False
    model_used: str

class AIChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    context_type: Optional[str] = "general_security"

class AIChatResponse(BaseModel):
    reply: str
    model: str
