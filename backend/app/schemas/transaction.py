from typing import Optional, List
from pydantic import BaseModel, Field

class InitiatePaymentRequest(BaseModel):
    recipient_upi_id: str = Field(..., description="Recipient UPI-style ID, e.g. aman@raksha or merchant@upi")
    amount_rupees: float = Field(..., gt=0, description="Amount in INR rupees (e.g. 500.0)")
    note: Optional[str] = Field(None, max_length=255, description="Optional payment remark")
    idempotency_key: str = Field(..., description="Unique client-generated idempotency key")

class TransactionResponse(BaseModel):
    id: str
    transaction_ref: str
    sender_account_id: str
    recipient_account_id: Optional[str] = None
    recipient_upi_id: str
    recipient_name: str
    amount_paise: int
    amount_rupees: float
    status: str
    risk_score: int
    risk_category: str
    decision_reason: Optional[str] = None
    risk_signals: List[str] = []
    note: Optional[str] = None
    idempotency_key: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    ai_explanation: Optional[str] = None

class TransactionReceiptResponse(BaseModel):
    transaction_ref: str
    date_time: str
    amount_rupees: float
    amount_paise: int
    status: str
    sender_upi_id: str
    sender_name: str
    recipient_upi_id: str
    recipient_name: str
    risk_score: int
    risk_category: str
    decision_reason: Optional[str] = None
    note: Optional[str] = None
    ledger_verified: bool
    is_simulated: bool = True
