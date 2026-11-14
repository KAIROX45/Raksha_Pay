import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    upi_id = Column(String(100), unique=True, index=True, nullable=False)
    account_number = Column(String(20), unique=True, nullable=False)
    ifsc_code = Column(String(11), default="RAKS0001001", nullable=False)
    balance_paise = Column(BigInteger, default=0, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", backref="accounts")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "upi_id": self.upi_id,
            "account_number": self.account_number,
            "ifsc_code": self.ifsc_code,
            "balance_paise": self.balance_paise,
            "balance_rupees": self.balance_paise / 100.0,
            "currency": self.currency,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
