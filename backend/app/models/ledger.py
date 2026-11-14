import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class EntryType(str, enum.Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey("transactions.id", ondelete="RESTRICT"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True)
    entry_type = Column(String(10), nullable=False)  # DEBIT or CREDIT
    amount_paise = Column(BigInteger, nullable=False)
    balance_after_paise = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    transaction = relationship("Transaction", backref="ledger_entries")
    account = relationship("Account", backref="ledger_entries")

    def to_dict(self):
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "account_id": self.account_id,
            "entry_type": self.entry_type,
            "amount_paise": self.amount_paise,
            "amount_rupees": self.amount_paise / 100.0,
            "balance_after_paise": self.balance_after_paise,
            "balance_after_rupees": self.balance_after_paise / 100.0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
