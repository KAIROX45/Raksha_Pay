import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    upi_id = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    account_age_days = Column(Integer, default=30, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)
    report_count = Column(Integer, default=0, nullable=False)
    verification_status = Column(String(30), default="SIMULATED_VERIFIED", nullable=False)
    risk_indicators = Column(Text, nullable=True)  # JSON-encoded array
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        import json
        indicators = []
        if self.risk_indicators:
            try:
                indicators = json.loads(self.risk_indicators)
            except Exception:
                indicators = [self.risk_indicators]

        return {
            "id": self.id,
            "upi_id": self.upi_id,
            "name": self.name,
            "account_age_days": self.account_age_days,
            "risk_level": self.risk_level,
            "report_count": self.report_count,
            "verification_status": self.verification_status,
            "risk_indicators": indicators,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class RecipientReport(Base):
    __tablename__ = "recipient_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    upi_id = Column(String(100), index=True, nullable=False)
    reporter_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, VERIFIED, DISMISSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    reporter = relationship("User", backref="reported_recipients")

    def to_dict(self):
        return {
            "id": self.id,
            "upi_id": self.upi_id,
            "reporter_user_id": self.reporter_user_id,
            "reason": self.reason,
            "details": self.details,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
