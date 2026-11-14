import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class TransactionStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    PENDING = "PENDING"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"

class RiskCategory(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_ref = Column(String(40), unique=True, index=True, nullable=False)
    
    sender_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False, index=True)
    recipient_account_id = Column(String(36), ForeignKey("accounts.id"), nullable=True, index=True)
    
    recipient_upi_id = Column(String(100), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=False)
    
    amount_paise = Column(BigInteger, nullable=False)
    status = Column(String(20), default=TransactionStatus.PENDING.value, nullable=False, index=True)
    
    risk_score = Column(Integer, default=0, nullable=False)
    risk_category = Column(String(20), default=RiskCategory.LOW.value, nullable=False)
    decision_reason = Column(Text, nullable=True)
    risk_signals = Column(Text, nullable=True)  # JSON-encoded array of signals
    
    note = Column(String(255), nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=False, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    sender_account = relationship("Account", foreign_keys=[sender_account_id], backref="sent_transactions")
    recipient_account = relationship("Account", foreign_keys=[recipient_account_id], backref="received_transactions")

    def to_dict(self):
        import json
        signals = []
        if self.risk_signals:
            try:
                signals = json.loads(self.risk_signals)
            except Exception:
                signals = [self.risk_signals]

        return {
            "id": self.id,
            "transaction_ref": self.transaction_ref,
            "sender_account_id": self.sender_account_id,
            "recipient_account_id": self.recipient_account_id,
            "recipient_upi_id": self.recipient_upi_id,
            "recipient_name": self.recipient_name,
            "amount_paise": self.amount_paise,
            "amount_rupees": self.amount_paise / 100.0,
            "status": self.status,
            "risk_score": self.risk_score,
            "risk_category": self.risk_category,
            "decision_reason": self.decision_reason,
            "risk_signals": signals,
            "note": self.note,
            "idempotency_key": self.idempotency_key,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
