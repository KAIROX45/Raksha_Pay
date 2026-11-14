from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class FraudAnalysisRequest(BaseModel):
    recipient_upi_id: str
    amount_rupees: float
    note: Optional[str] = None

class FraudAnalysisResult(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    risk_category: str  # LOW, MEDIUM, HIGH
    recommended_action: str  # APPROVE, VERIFY, BLOCK
    detection_signals: List[str] = []
    rule_score: int
    ml_score: Optional[int] = None
    model_version: str
    feature_importance: Optional[Dict[str, float]] = None
    explanation: str

class FraudAlertItem(BaseModel):
    id: str
    transaction_id: Optional[str]
    user_id: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None
    risk_score: int
    severity: str
    signals: List[str] = []
    explanation: Optional[str] = None
    gemini_analysis: Optional[str] = None
    status: str
    created_at: Optional[str] = None
    notes_count: int = 0
