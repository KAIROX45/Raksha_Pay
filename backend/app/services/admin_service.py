"""
Admin Service: Security Operations Center Telemetry & Controls
Calculates real metrics from database records, manages fraud investigations,
user account soft-suspensions, and immutable audit logs.
"""
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.user import User, UserStatus
from app.models.account import Account
from app.models.transaction import Transaction, TransactionStatus
from app.models.fraud import FraudAlert, FraudAlertStatus, InvestigationNote
from app.models.audit import AuditLog

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def get_overview_statistics(self) -> Dict[str, Any]:
        """Calculates authentic telemetry strictly from current database records."""
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_transactions = self.db.query(func.count(Transaction.id)).scalar() or 0
        
        approved_count = self.db.query(func.count(Transaction.id)).filter(
            Transaction.status == TransactionStatus.APPROVED.value
        ).scalar() or 0

        pending_count = self.db.query(func.count(Transaction.id)).filter(
            Transaction.status == TransactionStatus.PENDING.value
        ).scalar() or 0

        blocked_count = self.db.query(func.count(Transaction.id)).filter(
            Transaction.status == TransactionStatus.BLOCKED.value
        ).scalar() or 0

        failed_count = self.db.query(func.count(Transaction.id)).filter(
            Transaction.status == TransactionStatus.FAILED.value
        ).scalar() or 0

        total_volume_paise = self.db.query(func.sum(Transaction.amount_paise)).filter(
            Transaction.status == TransactionStatus.APPROVED.value
        ).scalar() or 0

        total_alerts = self.db.query(func.count(FraudAlert.id)).scalar() or 0
        unresolved_alerts = self.db.query(func.count(FraudAlert.id)).filter(
            FraudAlert.status.in_([FraudAlertStatus.NEW.value, FraudAlertStatus.UNDER_REVIEW.value])
        ).scalar() or 0

        return {
            "total_users": total_users,
            "total_transactions": total_transactions,
            "approved_transactions": approved_count,
            "pending_transactions": pending_count,
            "blocked_transactions": blocked_count,
            "failed_transactions": failed_count,
            "total_simulated_volume_rupees": float(total_volume_paise) / 100.0,
            "total_fraud_alerts": total_alerts,
            "unresolved_alerts": unresolved_alerts,
            "system_status": "OPERATIONAL",
        }

    def list_transactions(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = self.db.query(Transaction)
        if status and status.upper() != "ALL":
            query = query.filter(Transaction.status == status.upper())
        if search:
            s = f"%{search.strip()}%"
            query = query.filter(
                (Transaction.transaction_ref.ilike(s)) |
                (Transaction.recipient_upi_id.ilike(s)) |
                (Transaction.recipient_name.ilike(s))
            )
        transactions = query.order_by(desc(Transaction.created_at)).offset(offset).limit(limit).all()
        return [t.to_dict() for t in transactions]

    def list_fraud_alerts(
        self,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = self.db.query(FraudAlert)
        if status and status.upper() != "ALL":
            query = query.filter(FraudAlert.status == status.upper())
        if severity and severity.upper() != "ALL":
            query = query.filter(FraudAlert.severity == severity.upper())
        alerts = query.order_by(desc(FraudAlert.created_at)).offset(offset).limit(limit).all()
        return [a.to_dict() for a in alerts]

    def add_investigation_note(
        self,
        alert_id: str,
        admin_id: str,
        note: str,
        status_change: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        alert = self.db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
        if not alert:
            raise ValueError(f"Fraud alert {alert_id} not found.")

        investigation_note = InvestigationNote(
            alert_id=alert.id,
            admin_id=admin_id,
            note=note,
            status_change=status_change,
        )
        self.db.add(investigation_note)

        if status_change and status_change in [e.value for e in FraudAlertStatus]:
            alert.status = status_change

        # Record audit log
        audit = AuditLog(
            actor_id=admin_id,
            actor_role="admin",
            action="INVESTIGATION_NOTE_ADDED",
            target_type="fraud_alert",
            target_id=alert.id,
            ip_address=ip_address,
            details_json=json.dumps({"note": note, "status_change": status_change})
        )
        self.db.add(audit)

        self.db.commit()
        self.db.refresh(investigation_note)
        return investigation_note.to_dict()

    def update_user_status(
        self,
        user_id: str,
        new_status: str,
        admin_id: str,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """Soft-suspends or reactivates a user account while preserving financial ledger history."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found.")

        if new_status not in [UserStatus.ACTIVE.value, UserStatus.SUSPENDED.value]:
            raise ValueError("Status must be either 'active' or 'suspended'.")

        old_status = user.status
        user.status = new_status

        audit = AuditLog(
            actor_id=admin_id,
            actor_role="admin",
            action=f"USER_STATUS_{new_status.upper()}",
            target_type="user",
            target_id=user.id,
            ip_address=ip_address,
            details_json=json.dumps({
                "old_status": old_status,
                "new_status": new_status,
                "reason": reason or "Administrative security measure",
            })
        )
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(user)

        return user.to_dict()

    def list_users(self, search: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        query = self.db.query(User)
        if search:
            s = f"%{search.strip()}%"
            query = query.filter((User.full_name.ilike(s)) | (User.phone.ilike(s)) | (User.email.ilike(s)))
        users = query.order_by(desc(User.created_at)).offset(offset).limit(limit).all()
        
        results = []
        for u in users:
            d = u.to_dict()
            account = self.db.query(Account).filter(Account.user_id == u.id).first()
            if account:
                d["upi_id"] = account.upi_id
                d["balance_rupees"] = account.balance_paise / 100.0
            else:
                d["upi_id"] = None
                d["balance_rupees"] = 0.0
            results.append(d)
        return results

    def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        logs = self.db.query(AuditLog).order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
        return [l.to_dict() for l in logs]
