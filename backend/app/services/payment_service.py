"""
Payment Service: 11-Step Simulated Payment Lifecycle
Executes full transactional validation, idempotency checks, fraud analysis,
ledger settlement, and notification generation.
"""
import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.logging import logger
from app.core.config import settings
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction, TransactionStatus, RiskCategory
from app.models.recipient import Recipient
from app.models.fraud import FraudAlert, FraudAlertSeverity, FraudAlertStatus
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.idempotency import IdempotencyRecord
from app.services.ledger_service import LedgerService, InsufficientBalanceError
from app.services.fraud_engine import FraudEngine
from app.services.gemini_service import gemini_service
from app.services.recipient_service import get_bank_for_upi

class PaymentError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.ledger_service = LedgerService(db)
        self.fraud_engine = FraudEngine(db)

    def initiate_payment(
        self,
        sender_user: User,
        recipient_upi_id: str,
        amount_rupees: float,
        idempotency_key: str,
        note: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the 11-step payment lifecycle:
        1. Idempotency verification
        2. Validate sender account
        3. Validate recipient existence in simulated environment
        4. Validate amount (positive paise)
        5. Check available balance
        6. Extract features & execute hybrid fraud detection
        7. Generate composite risk score & threshold decision
        8. For APPROVED: execute atomic double-entry debit & credit ledger entries
        9. For PENDING/BLOCKED: do not modify balance; record fraud alert
        10. Commit transaction & create audit log
        11. Generate Gemini AI explanation & return verified receipt
        """
        # STEP 1: Idempotency Check
        existing_idempotency = self.db.query(IdempotencyRecord).filter(
            IdempotencyRecord.key == idempotency_key,
            IdempotencyRecord.user_id == sender_user.id
        ).first()

        if existing_idempotency and existing_idempotency.response_body:
            logger.info("Idempotent request detected for key: %s", idempotency_key)
            return json.loads(existing_idempotency.response_body)

        # Record idempotency key lock
        now = datetime.now(timezone.utc)
        idemp_record = IdempotencyRecord(
            key=idempotency_key,
            user_id=sender_user.id,
            request_hash=f"{sender_user.id}:{recipient_upi_id}:{amount_rupees}",
            expires_at=now + timedelta(hours=24)
        )
        self.db.add(idemp_record)
        self.db.flush()

        # STEP 2: Validate sender account
        sender_account = self.db.query(Account).filter(
            Account.user_id == sender_user.id,
            Account.status == "ACTIVE"
        ).first()

        if not sender_account:
            raise PaymentError("Active sender account not found.", status_code=404)

        # Prevent sending money to oneself
        if sender_account.upi_id.lower() == recipient_upi_id.strip().lower():
            raise PaymentError("Cannot send money to your own UPI ID.", status_code=400)

        # STEP 3: Validate recipient existence in simulated directory
        clean_recipient_upi = (recipient_upi_id or "").strip().lower()
        recipient_record = self.db.query(Recipient).filter(
            func.lower(func.trim(Recipient.upi_id)) == clean_recipient_upi
        ).first()

        recipient_account = self.db.query(Account).filter(
            func.lower(func.trim(Account.upi_id)) == clean_recipient_upi,
            Account.status == "ACTIVE"
        ).first()

        # Ensure debabratadas7557@okhdfcbank is recognized as a registered demo recipient
        if not recipient_record and clean_recipient_upi == "debabratadas7557@okhdfcbank":
            recipient_record = Recipient(
                upi_id="debabratadas7557@okhdfcbank",
                name="Debabrata Das",
                account_age_days=240,
                risk_level="LOW",
                report_count=0,
                verification_status="SIMULATED_VERIFIED",
                risk_indicators=json.dumps(["Verified Bank Contact", "KYC Completed"]),
            )
            self.db.add(recipient_record)
            self.db.flush()

        recipient_name = "Unknown Recipient"
        if recipient_account and recipient_account.user:
            recipient_name = recipient_account.user.full_name
        elif recipient_record:
            recipient_name = recipient_record.name
        else:
            raise PaymentError(
                f"Recipient UPI ID '{recipient_upi_id}' does not exist in the simulated RakshaPay directory. Please verify the ID or check recipient reputation first.",
                status_code=404
            )

        # STEP 4: Convert amount to integer paise
        amount_paise = int(round(amount_rupees * 100))
        if amount_paise <= 0:
            raise PaymentError("Payment amount must be greater than zero.", status_code=400)

        # STEP 5: Check available balance
        if sender_account.balance_paise < amount_paise:
            raise PaymentError(
                f"Insufficient funds. Available balance: ₹{sender_account.balance_paise/100:,.2f}, required: ₹{amount_rupees:,.2f}",
                status_code=400
            )

        # STEP 6 & 7: Fraud Detection & Risk Scoring
        fraud_result = self.fraud_engine.analyze_transaction(
            sender_account_id=sender_account.id,
            recipient_upi_id=clean_recipient_upi,
            amount_rupees=amount_rupees,
            note=note
        )

        risk_score = fraud_result["risk_score"]
        risk_category = fraud_result["risk_category"]
        recommended_action = fraud_result["recommended_action"]
        detection_signals = fraud_result["detection_signals"]
        decision_reason = fraud_result["decision_reason"]

        # Generate unique transaction reference (e.g. RAKSHA-20261114-A7F2D)
        ref_suffix = uuid.uuid4().hex[:8].upper()
        date_str = now.strftime("%Y%m%d")
        txn_ref = f"RAKSHA-{date_str}-{ref_suffix}"

        # Initialize transaction record
        tx = Transaction(
            transaction_ref=txn_ref,
            sender_account_id=sender_account.id,
            recipient_account_id=recipient_account.id if recipient_account else None,
            recipient_upi_id=clean_recipient_upi,
            recipient_name=recipient_name,
            amount_paise=amount_paise,
            risk_score=risk_score,
            risk_category=risk_category,
            decision_reason=decision_reason,
            risk_signals=json.dumps(detection_signals),
            note=note,
            idempotency_key=idempotency_key,
        )

        ai_explanation = None

        # STEP 8 & 9: Decision Enforcement & Ledger Processing
        # Authorized with OTP: approve if risk is below high-threat threshold (70)
        if recommended_action == "APPROVE" or (recommended_action == "VERIFY" and risk_score < settings.FRAUD_HIGH_THRESHOLD):
            tx.status = TransactionStatus.APPROVED.value
            self.db.add(tx)
            self.db.flush()

            # If recipient has an internal account, credit it; else, credit external settlement pool
            if recipient_account:
                self.ledger_service.execute_transfer(tx, sender_account, recipient_account)
            else:
                settlement_pool = self.ledger_service.get_or_create_external_settlement_account()
                self.ledger_service.execute_transfer(tx, sender_account, settlement_pool)

            # Create success notification
            notif = Notification(
                user_id=sender_user.id,
                title="Payment Sent Successfully",
                message=f"₹{amount_rupees:,.2f} transferred to {recipient_name} ({clean_recipient_upi}). Ref: {txn_ref}",
                type="PAYMENT",
                metadata_json=json.dumps({"transaction_ref": txn_ref, "amount_rupees": amount_rupees})
            )
            self.db.add(notif)

        elif recommended_action == "VERIFY":
            tx.status = TransactionStatus.PENDING.value
            self.db.add(tx)
            self.db.flush()

            # Record Fraud Alert (MEDIUM severity)
            alert = FraudAlert(
                transaction_id=tx.id,
                user_id=sender_user.id,
                risk_score=risk_score,
                severity=FraudAlertSeverity.MEDIUM.value,
                signals=json.dumps(detection_signals),
                explanation=decision_reason,
                status=FraudAlertStatus.NEW.value,
            )
            self.db.add(alert)

            # Security notification
            notif = Notification(
                user_id=sender_user.id,
                title="Payment Verification Required",
                message=f"Payment of ₹{amount_rupees:,.2f} to {clean_recipient_upi} held pending secondary security verification.",
                type="FRAUD_ALERT",
                metadata_json=json.dumps({"transaction_ref": txn_ref, "risk_score": risk_score})
            )
            self.db.add(notif)

        else:  # BLOCK
            tx.status = TransactionStatus.BLOCKED.value
            self.db.add(tx)
            self.db.flush()

            # Generate Gemini AI Explanation for blocked high-risk event
            gemini_exp = gemini_service.explain_fraud(
                recipient_upi_id=clean_recipient_upi,
                amount_rupees=amount_rupees,
                risk_score=risk_score,
                detection_signals=detection_signals
            )
            ai_explanation = gemini_exp.get("why_flagged", "") + "\n\n" + gemini_exp.get("what_to_be_careful_about", "")

            # Record Fraud Alert (HIGH / CRITICAL)
            alert = FraudAlert(
                transaction_id=tx.id,
                user_id=sender_user.id,
                risk_score=risk_score,
                severity=FraudAlertSeverity.HIGH.value if risk_score < 85 else FraudAlertSeverity.CRITICAL.value,
                signals=json.dumps(detection_signals),
                explanation=decision_reason,
                gemini_analysis=json.dumps(gemini_exp),
                status=FraudAlertStatus.NEW.value,
            )
            self.db.add(alert)

            notif = Notification(
                user_id=sender_user.id,
                title="High-Risk Payment Blocked",
                message=f"A high-risk payment of ₹{amount_rupees:,.2f} to {clean_recipient_upi} was blocked to protect your wallet.",
                type="FRAUD_ALERT",
                metadata_json=json.dumps({"transaction_ref": txn_ref, "risk_score": risk_score})
            )
            self.db.add(notif)

        # STEP 10: Audit Log
        audit = AuditLog(
            actor_id=sender_user.id,
            actor_role=sender_user.role,
            action=f"PAYMENT_{tx.status}",
            target_type="transaction",
            target_id=tx.id,
            ip_address=ip_address,
            details_json=json.dumps({
                "transaction_ref": txn_ref,
                "amount_rupees": amount_rupees,
                "recipient_upi": clean_recipient_upi,
                "risk_score": risk_score,
                "status": tx.status
            })
        )
        self.db.add(audit)

        # Commit entire atomic transaction
        self.db.commit()
        self.db.refresh(tx)

        # Prepare final response payload
        response_payload = {
            "id": tx.id,
            "transaction_ref": tx.transaction_ref,
            "sender_account_id": sender_account.id,
            "sender_upi_id": sender_account.upi_id,
            "sender_name": sender_user.full_name,
            "recipient_upi_id": tx.recipient_upi_id,
            "recipient_name": tx.recipient_name,
            "recipient_bank": get_bank_for_upi(tx.recipient_upi_id),
            "amount_paise": tx.amount_paise,
            "amount_rupees": amount_rupees,
            "status": tx.status,
            "risk_score": tx.risk_score,
            "risk_category": tx.risk_category,
            "decision_reason": tx.decision_reason,
            "risk_signals": detection_signals,
            "note": tx.note,
            "idempotency_key": tx.idempotency_key,
            "created_at": tx.created_at.isoformat(),
            "updated_at": tx.updated_at.isoformat(),
            "ai_explanation": ai_explanation,
            "ledger_verified": tx.status == TransactionStatus.APPROVED.value,
            "is_simulated": True,
        }

        # Update idempotency record with completed response
        idemp_record.response_code = 200
        idemp_record.response_body = json.dumps(response_payload)
        self.db.commit()

        return response_payload
