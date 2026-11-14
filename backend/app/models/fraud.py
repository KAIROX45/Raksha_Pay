import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class FraudAlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class FraudAlertStatus(str, enum.Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_score = Column(Integer, default=0, nullable=False)
    severity = Column(String(20), default=FraudAlertSeverity.MEDIUM.value, nullable=False)
    signals = Column(Text, nullable=True)  # JSON-encoded array
    explanation = Column(Text, nullable=True)
    gemini_analysis = Column(Text, nullable=True)
    status = Column(String(20), default=FraudAlertStatus.NEW.value, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    transaction = relationship("Transaction", backref="fraud_alerts")
    user = relationship("User", backref="fraud_alerts")
    notes = relationship("InvestigationNote", back_populates="alert", cascade="all, delete-orphan")

    def to_dict(self):
        import json
        signals_list = []
        if self.signals:
            try:
                signals_list = json.loads(self.signals)
            except Exception:
                signals_list = [self.signals]

        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "user_phone": self.user.phone if self.user else None,
            "user_name": self.user.full_name if self.user else None,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "signals": signals_list,
            "explanation": self.explanation,
            "gemini_analysis": self.gemini_analysis,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "notes_count": len(self.notes) if self.notes else 0,
        }

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = Column(String(36), ForeignKey("fraud_alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    status_change = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    alert = relationship("FraudAlert", back_populates="notes")
    admin = relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "admin_id": self.admin_id,
            "admin_name": self.admin.full_name if self.admin else "Admin",
            "note": self.note,
            "status_change": self.status_change,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
