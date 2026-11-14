from typing import Optional, List
from pydantic import BaseModel, Field

class RecipientRiskResponse(BaseModel):
    upi_id: str
    name: str
    bank_name: Optional[str] = "Simulated Partner Bank"
    is_registered: bool = True
    account_age_days: int = 30
    risk_level: str = "LOW"  # LOW, MEDIUM, HIGH
    report_count: int = 0
    verification_status: str = "SIMULATED_VERIFIED"  # SIMULATED_VERIFIED, UNVERIFIED, FLAGGED_SUSPICIOUS
    risk_indicators: List[str] = []
    is_simulated: bool = True
    explanation: str = ""

class ReportRecipientRequest(BaseModel):
    upi_id: str = Field(..., description="Recipient UPI-style ID")
    reason: str = Field(..., description="Reason for report, e.g. Impersonation, Fake QR, Phishing")
    details: Optional[str] = Field(None, description="Additional context or evidence")

class ReportRecipientResponse(BaseModel):
    success: bool
    message: str
    report_id: str
