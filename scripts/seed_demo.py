"""
Demo Seed Data Script for RakshaPay
Populates database with clearly labeled DEMO users, simulated accounts,
recipients directory, sample transactions, and fraud alerts.
"""
import sys
import os
import json
import uuid
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.account import Account
from app.models.recipient import Recipient, RecipientReport
from app.models.transaction import Transaction, TransactionStatus, RiskCategory
from app.models.ledger import LedgerEntry, EntryType
from app.models.fraud import FraudAlert, FraudAlertSeverity, FraudAlertStatus, InvestigationNote
from app.models.notification import Notification
from app.models.audit import AuditLog

def seed_demo_environment():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("--- Seeding RakshaPay DEMO Data ---")

    try:
        # Check if already seeded
        existing_user = db.query(User).filter(User.phone == "+919876543210").first()
        if existing_user:
            print("Demo data already present. Skipping re-seed.")
            return

        now = datetime.now(timezone.utc)

        # 1. Create Demo Customer (Rohit Sharma)
        user_customer = User(
            phone="+919876543210",
            full_name="Rohit Sharma [DEMO]",
            email="rohit.demo@rakshapay.in",
            role=UserRole.USER.value,
            status=UserStatus.ACTIVE.value,
            is_demo=True,
        )
        db.add(user_customer)
        db.flush()

        account_customer = Account(
            user_id=user_customer.id,
            upi_id="rohit@raksha",
            account_number="100100987654",
            ifsc_code="RAKS0001001",
            balance_paise=5000000,  # ₹50,000.00
            currency="INR",
            status="ACTIVE",
        )
        db.add(account_customer)
        db.flush()

        # 2. Create Second Demo User (Aman Gupta)
        user_peer = User(
            phone="+919876543211",
            full_name="Aman Gupta [DEMO]",
            email="aman.demo@rakshapay.in",
            role=UserRole.USER.value,
            status=UserStatus.ACTIVE.value,
            is_demo=True,
        )
        db.add(user_peer)
        db.flush()

        account_peer = Account(
            user_id=user_peer.id,
            upi_id="aman@raksha",
            account_number="100100987655",
            ifsc_code="RAKS0001001",
            balance_paise=2500000,  # ₹25,000.00
            currency="INR",
            status="ACTIVE",
        )
        db.add(account_peer)
        db.flush()

        # 3. Create Admin User (RakshaPay SOC Admin)
        admin_user = User(
            phone="+919999900000",
            full_name="SOC Fraud Investigator [DEMO ADMIN]",
            email="soc.admin@rakshapay.internal",
            password_hash=get_password_hash("Admin@Raksha2026"),
            role=UserRole.ADMIN.value,
            status=UserStatus.ACTIVE.value,
            is_demo=True,
        )
        db.add(admin_user)
        db.flush()

        # 4. Seed Simulated Recipients Directory
        recipients_data = [
            {
                "upi_id": "debabratadas7557@okhdfcbank",
                "name": "Debabrata Das",
                "account_age_days": 240,
                "risk_level": "LOW",
                "report_count": 0,
                "verification_status": "SIMULATED_VERIFIED",
                "risk_indicators": json.dumps(["Verified Bank Contact", "KYC Completed"]),
            },
            {
                "upi_id": "aman@raksha",
                "name": "Aman Gupta (Peer Contact)",
                "account_age_days": 180,
                "risk_level": "LOW",
                "report_count": 0,
                "verification_status": "SIMULATED_VERIFIED",
                "risk_indicators": json.dumps(["Trusted peer contact", "KYC Completed"]),
            },
            {
                "upi_id": "quickmart@upi",
                "name": "QuickMart Daily Needs",
                "account_age_days": 420,
                "risk_level": "LOW",
                "report_count": 0,
                "verification_status": "SIMULATED_VERIFIED",
                "risk_indicators": json.dumps(["Verified Retail Merchant", "High volume good standing"]),
            },
            {
                "upi_id": "coffeehub@upi",
                "name": "Artisan Coffee House",
                "account_age_days": 210,
                "risk_level": "LOW",
                "report_count": 0,
                "verification_status": "SIMULATED_VERIFIED",
                "risk_indicators": json.dumps(["Verified Merchant", "Physical store"]),
            },
            {
                "upi_id": "techsupport@fakeupi",
                "name": "Global Tech Support Impersonator",
                "account_age_days": 3,
                "risk_level": "HIGH",
                "report_count": 4,
                "verification_status": "FLAGGED_SUSPICIOUS",
                "risk_indicators": json.dumps([
                    "Reported for AnyDesk remote screen share scam",
                    "New account created 3 days ago",
                    "Multiple user fraud complaints"
                ]),
            },
            {
                "upi_id": "lotterywinner@giftupi",
                "name": "Cashback Prize Rewards",
                "account_age_days": 1,
                "risk_level": "HIGH",
                "report_count": 7,
                "verification_status": "FLAGGED_SUSPICIOUS",
                "risk_indicators": json.dumps([
                    "Known phishing keyword 'lottery'",
                    "Fake reward collect request",
                    "Excessive velocity anomalies"
                ]),
            },
            {
                "upi_id": "electricityboard@urgentpay",
                "name": "Urgent Utility Disconnect Scam",
                "account_age_days": 5,
                "risk_level": "HIGH",
                "report_count": 6,
                "verification_status": "FLAGGED_SUSPICIOUS",
                "risk_indicators": json.dumps([
                    "Impersonating power utility board",
                    "Urgent disconnection intimidation messages",
                    "Reported by consumer cyber safety desk"
                ]),
            },
        ]

        for r_data in recipients_data:
            rec = Recipient(**r_data)
            db.add(rec)
        db.flush()

        # 5. Seed Realistic Historical Transactions
        # Tx 1: Approved - Groceries
        tx1 = Transaction(
            transaction_ref="RAKSHA-20261110-GROCERY1",
            sender_account_id=account_customer.id,
            recipient_account_id=None,
            recipient_upi_id="quickmart@upi",
            recipient_name="QuickMart Daily Needs",
            amount_paise=125000,  # ₹1,250.00
            status=TransactionStatus.APPROVED.value,
            risk_score=12,
            risk_category=RiskCategory.LOW.value,
            decision_reason="Standard merchant payment within normal limits.",
            risk_signals=json.dumps([]),
            note="Weekly groceries",
            idempotency_key="idemp-demo-seed-1",
            created_at=now - timedelta(days=4),
        )
        db.add(tx1)
        db.flush()

        # Ledger entries for Tx 1
        db.add(LedgerEntry(
            transaction_id=tx1.id,
            account_id=account_customer.id,
            entry_type=EntryType.DEBIT.value,
            amount_paise=125000,
            balance_after_paise=4875000,
            created_at=now - timedelta(days=4),
        ))

        # Tx 2: Approved - Coffee
        tx2 = Transaction(
            transaction_ref="RAKSHA-20261112-COFFEE02",
            sender_account_id=account_customer.id,
            recipient_account_id=None,
            recipient_upi_id="coffeehub@upi",
            recipient_name="Artisan Coffee House",
            amount_paise=34000,  # ₹340.00
            status=TransactionStatus.APPROVED.value,
            risk_score=8,
            risk_category=RiskCategory.LOW.value,
            decision_reason="Low value merchant payment.",
            risk_signals=json.dumps([]),
            note="Latte & Croissant",
            idempotency_key="idemp-demo-seed-2",
            created_at=now - timedelta(days=2),
        )
        db.add(tx2)
        db.flush()

        # Tx 3: Blocked - High Risk Impersonator Scam Attempt
        tx3 = Transaction(
            transaction_ref="RAKSHA-20261113-BLOCK001",
            sender_account_id=account_customer.id,
            recipient_account_id=None,
            recipient_upi_id="techsupport@fakeupi",
            recipient_name="Global Tech Support Impersonator",
            amount_paise=3500000,  # ₹35,000.00
            status=TransactionStatus.BLOCKED.value,
            risk_score=88,
            risk_category=RiskCategory.HIGH.value,
            decision_reason="High-risk transaction automatically blocked by fraud engine (Risk score: 88/100).",
            risk_signals=json.dumps([
                "Recipient UPI ID is flagged with active fraud reports or high risk reputation",
                "Elevated amount (₹35,000.00)",
                "First-time recipient (no historical transactions on record)"
            ]),
            note="Antivirus Renewal Fee",
            idempotency_key="idemp-demo-seed-3",
            created_at=now - timedelta(hours=14),
        )
        db.add(tx3)
        db.flush()

        # Fraud Alert for Tx 3
        alert1 = FraudAlert(
            transaction_id=tx3.id,
            user_id=user_customer.id,
            risk_score=88,
            severity=FraudAlertSeverity.CRITICAL.value,
            signals=tx3.risk_signals,
            explanation=tx3.decision_reason,
            gemini_analysis=json.dumps({
                "headline": "Blocked Impersonation Scam",
                "why_flagged": "The recipient has 4 active community reports for remote access fraud. High value transfer requested to an unverified entity.",
                "what_to_be_careful_about": "Scammers pose as tech support claiming your computer is infected and demand payment via UPI.",
                "recommended_action": "Do not pay. Block the phone caller immediately."
            }),
            status=FraudAlertStatus.UNDER_REVIEW.value,
            created_at=now - timedelta(hours=14),
        )
        db.add(alert1)
        db.flush()

        # Investigation Note by Admin on Alert 1
        note1 = InvestigationNote(
            alert_id=alert1.id,
            admin_id=admin_user.id,
            note="Confirmed recipient domain matches known AnyDesk telephone scam campaign. Blacklisted across network.",
            status_change=FraudAlertStatus.UNDER_REVIEW.value,
            created_at=now - timedelta(hours=12),
        )
        db.add(note1)

        # Tx 4: Pending - High Value to New Recipient
        tx4 = Transaction(
            transaction_ref="RAKSHA-20261114-PEND0001",
            sender_account_id=account_customer.id,
            recipient_account_id=None,
            recipient_upi_id="electricityboard@urgentpay",
            recipient_name="Urgent Utility Disconnect Scam",
            amount_paise=1500000,  # ₹15,000.00
            status=TransactionStatus.PENDING.value,
            risk_score=62,
            risk_category=RiskCategory.MEDIUM.value,
            decision_reason="Transaction held for secondary verification due to risk signals (Risk score: 62/100).",
            risk_signals=json.dumps([
                "Recipient UPI ID is flagged with active fraud reports or high risk reputation",
                "First-time recipient (no historical transactions on record)"
            ]),
            note="Urgent Power Bill",
            idempotency_key="idemp-demo-seed-4",
            created_at=now - timedelta(hours=3),
        )
        db.add(tx4)
        db.flush()

        alert2 = FraudAlert(
            transaction_id=tx4.id,
            user_id=user_customer.id,
            risk_score=62,
            severity=FraudAlertSeverity.MEDIUM.value,
            signals=tx4.risk_signals,
            explanation=tx4.decision_reason,
            status=FraudAlertStatus.NEW.value,
            created_at=now - timedelta(hours=3),
        )
        db.add(alert2)

        # 6. Notifications for Customer
        db.add(Notification(
            user_id=user_customer.id,
            title="Welcome to RakshaPay",
            message="Your smart AI payment security wallet has been provisioned with ₹50,000.00 simulated demo funds.",
            type="SYSTEM",
            created_at=now - timedelta(days=5),
        ))

        db.add(Notification(
            user_id=user_customer.id,
            title="Security Alert: Payment Blocked",
            message="A suspicious payment of ₹35,000.00 to techsupport@fakeupi was blocked to protect your wallet.",
            type="FRAUD_ALERT",
            created_at=now - timedelta(hours=14),
        ))

        # 7. Audit Log
        db.add(AuditLog(
            actor_id=admin_user.id,
            actor_role="admin",
            action="SYSTEM_INIT_SEED",
            target_type="system",
            target_id="rakshapay_v1",
            details_json=json.dumps({"seeded_by": "RakshaPay Automation", "records": "demo_baseline"}),
            created_at=now,
        ))

        db.commit()
        print("✓ Demo Customer Created: +919876543210 (OTP: 123456) | UPI: rohit@raksha | Balance: ₹50,000")
        print("✓ Demo Peer User Created: +919876543211 (OTP: 123456) | UPI: aman@raksha | Balance: ₹25,000")
        print("✓ Demo Admin Created: +919999900000 | Password: Admin@Raksha2026")
        print("✓ Simulated Recipients: 3 Clean, 3 Flagged/Scam addresses")
        print("✓ Historical Transactions: Approved, Blocked & Pending seeded")
        print("--- Demo Seeding Completed Successfully ---")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_environment()
