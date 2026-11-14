from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AdminOverviewStats(BaseModel):
    total_users: int
    total_transactions: int
    approved_transactions: int
    pending_transactions: int
    blocked_transactions: int
    failed_transactions: int
    total_simulated_volume_rupees: float
    total_fraud_alerts: int
    unresolved_alerts: int
    system_status: str

class UpdateUserStatusRequest(BaseModel):
    status: str = Field(..., description="'active' or 'suspended'")
    reason: Optional[str] = None

class AddInvestigationNoteRequest(BaseModel):
    note: str = Field(..., min_length=3)
    status_change: Optional[str] = Field(None, description="'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'")

class AdminAuditLogItem(BaseModel):
    id: str
    actor_id: Optional[str]
    actor_role: str
    action: str
    target_type: str
    target_id: Optional[str]
    ip_address: Optional[str]
    details: Dict[str, Any]
    created_at: Optional[str]
