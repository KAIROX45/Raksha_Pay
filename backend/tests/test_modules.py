"""
Test Suite for RakshaPay 3 Core Interactive Modules:
1. Real-Time Scam Detection & Recipient Verification (Random Forest & Gemini)
2. Double-Entry Ledger & + ₹10,000 Demo Top-Up (Integer Paise Precision)
3. Dynamic Financial Analytics Chart & Weekly Anomaly Index (Standard Deviation)
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.user import User, UserRole, UserStatus
from app.models.account import Account
from app.models.recipient import Recipient
from app.models.transaction import Transaction, TransactionStatus
from app.models.ledger import LedgerEntry, EntryType
from app.services.ledger_service import LedgerService
from app.api.v1.analyze import analyze_transaction, AnalyzeTransactionRequest
from app.api.v1.wallet import wallet_topup, get_wallet_summary, TopupRequest

TEST_DB_URL = "sqlite://"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = Session()

    # Seed test customer Rohit
    user = User(
        id="user-rohit-01",
        phone="+919876543210",
        full_name="Rohit Sharma",
        role=UserRole.USER.value,
        status=UserStatus.ACTIVE.value,
        is_demo=True,
    )
    session.add(user)
    session.flush()

    account = Account(
        id="acc-rohit-01",
        user_id=user.id,
        upi_id="rohit@raksha",
        account_number="ACC10001",
        balance_paise=5000000,  # ₹50,000.00
        currency="INR",
        status="ACTIVE",
    )
    session.add(account)

    # Seed scam recipient
    scam_rec = Recipient(
        upi_id="techsupport@fakeupi",
        name="Tech Support Scammer",
        account_age_days=2,
        risk_level="HIGH",
        report_count=5,
        verification_status="FLAGGED_SUSPICIOUS",
    )
    session.add(scam_rec)

    # Seed legitimate recipient
    safe_rec = Recipient(
        upi_id="aman@raksha",
        name="Aman Gupta",
        account_age_days=180,
        risk_level="LOW",
        report_count=0,
        verification_status="SIMULATED_VERIFIED",
    )
    session.add(safe_rec)

    session.commit()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_module_1_safe_transaction_analysis(db_session):
    """Verifies that legitimate transfer passes hybrid RF & Gemini check."""
    user = db_session.query(User).filter(User.phone == "+919876543210").first()
    req = AnalyzeTransactionRequest(
        upi_id="aman@raksha",
        amount=500.0,
        note="Lunch with team",
    )
    res = analyze_transaction(req, db_session, user)

    assert res["is_threat"] is False
    assert res["risk_category"] == "LOW"
    assert res["recommended_action"] == "APPROVE"
    assert res["risk_score"] < 30
    assert "rf_score" in res
    assert "gemini_score" in res
    assert res["structured_features"]["amount"] == 500.0

def test_module_1_scam_detection_and_threat_interception(db_session):
    """Verifies that fraudulent payment is intercepted and blocked by hybrid scoring."""
    user = db_session.query(User).filter(User.phone == "+919876543210").first()
    req = AnalyzeTransactionRequest(
        upi_id="techsupport@fakeupi",
        amount=25000.0,
        note="URGENT: Electricity disconnected tonight, pay immediately or download AnyDesk APK",
    )
    res = analyze_transaction(req, db_session, user)

    assert res["is_threat"] is True
    assert res["risk_category"] == "HIGH"
    assert res["recommended_action"] == "BLOCK"
    assert res["risk_score"] >= 70
    assert len(res["detection_signals"]) > 0
    assert res["gemini_analysis"]["phishing_detected"] is True
    assert res["gemini_analysis"]["urgency_detected"] is True

def test_module_2_double_entry_ledger_topup(db_session):
    """Verifies that + ₹10,000 topup creates balanced DEBIT and CREDIT ledger entries."""
    user = db_session.query(User).filter(User.phone == "+919876543210").first()
    account = db_session.query(Account).filter(Account.user_id == user.id).first()

    initial_balance_paise = account.balance_paise

    # Topup ₹10,000
    topup_payload = TopupRequest(amount_rupees=10000.0)
    topup_res = wallet_topup(topup_payload, db_session, user)

    assert topup_res["success"] is True
    assert topup_res["amount_paise"] == 1000000  # 10,000 INR = 1,000,000 paise
    assert topup_res["new_balance_paise"] == initial_balance_paise + 1000000

    # Verify 2 balanced ledger entries exist for the transaction
    tx_ref = topup_res["transaction_ref"]
    tx = db_session.query(Transaction).filter(Transaction.transaction_ref == tx_ref).first()
    assert tx is not None
    assert tx.status == TransactionStatus.APPROVED.value

    ledger_entries = db_session.query(LedgerEntry).filter(LedgerEntry.transaction_id == tx.id).all()
    assert len(ledger_entries) == 2

    debit_entry = next((e for e in ledger_entries if e.entry_type == EntryType.DEBIT.value), None)
    credit_entry = next((e for e in ledger_entries if e.entry_type == EntryType.CREDIT.value), None)

    assert debit_entry is not None
    assert credit_entry is not None
    assert debit_entry.amount_paise == 1000000
    assert credit_entry.amount_paise == 1000000

def test_module_3_wallet_summary_and_anomaly_index(db_session):
    """Verifies live summary telemetry and standard deviation weekly anomaly index calculation."""
    user = db_session.query(User).filter(User.phone == "+919876543210").first()

    summary_before = get_wallet_summary(db_session, user)
    assert summary_before["available_balance_rupees"] == 50000.0
    assert "weekly_analytics" in summary_before
    assert len(summary_before["weekly_analytics"]) == 7
    assert "weekly_anomaly_index" in summary_before
    assert summary_before["weekly_anomaly_index"]["status"] in ["Optimal", "Moderate Variance", "Elevated Spend Spike"]

    # Top-up demo balance
    wallet_topup(TopupRequest(amount_rupees=10000.0), db_session, user)

    # Re-fetch summary
    summary_after = get_wallet_summary(db_session, user)
    assert summary_after["available_balance_rupees"] == 60000.0
    assert summary_after["total_transactions"] == summary_before["total_transactions"] + 1
    assert summary_after["approved_transfers"] == summary_before["approved_transfers"] + 1
