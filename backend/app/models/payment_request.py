import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, DateTime
from app.core.database import Base

class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    requester_upi_id = Column(String(100), nullable=False, index=True)
    payer_upi_id = Column(String(100), nullable=False, index=True)
    amount_paise = Column(BigInteger, nullable=False)
    note = Column(String(255), nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, PAID, DECLINED, EXPIRED
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "requester_upi_id": self.requester_upi_id,
            "payer_upi_id": self.payer_upi_id,
            "amount_paise": self.amount_paise,
            "amount_rupees": self.amount_paise / 100.0,
            "note": self.note,
            "status": self.status,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
