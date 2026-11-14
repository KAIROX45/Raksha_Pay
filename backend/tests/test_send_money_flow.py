import pytest
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.account import Account
from app.models.recipient import Recipient
from app.services.recipient_service import RecipientService, get_bank_for_upi
from app.services.payment_service import PaymentService, PaymentError
from app.services.fraud_engine import FraudEngine

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_step1_and_2_recipient_verification_registered(db: Session):
    """Verify registered recipients are correctly recognized with bank name and trim/lowercase normalization."""
    service = RecipientService(db)
    
    # 1. Exact match
    res = service.check_recipient_risk("debabratadas7557@okhdfcbank")
    assert res["is_registered"] is True
    assert res["name"] == "Debabrata Das"
    assert res["bank_name"] == "HDFC Bank"
    assert res["upi_id"] == "debabratadas7557@okhdfcbank"
    assert res["verification_status"] == "SIMULATED_VERIFIED"

    # 2. Trim and uppercase normalization
    res_normalized = service.check_recipient_risk("   DEBABRATADAS7557@OKHDFCBANK   ")
    assert res_normalized["is_registered"] is True
    assert res_normalized["name"] == "Debabrata Das"
    assert res_normalized["bank_name"] == "HDFC Bank"
    assert res_normalized["upi_id"] == "debabratadas7557@okhdfcbank"

    # 3. Another simulated directory recipient (Aman)
    res_aman = service.check_recipient_risk("aman@raksha")
    assert res_aman["is_registered"] is True
    assert "Aman" in res_aman["name"]
    assert res_aman["bank_name"] == "Raksha Vault & Partner Bank"

def test_step1_and_2_recipient_verification_unregistered(db: Session):
    """Verify unregistered recipients are not registered and flagged with clear error."""
    service = RecipientService(db)
    unregistered_upi = "nonexistent_stranger_999@fakebank"
    res = service.check_recipient_risk(unregistered_upi)
    assert res["is_registered"] is False
    assert res["verification_status"] == "UNVERIFIED"
    assert "does not exist in the simulated RakshaPay directory" in res["explanation"]

def test_step4_ai_security_check_safe_vs_scam(db: Session):
    """Verify AI fraud engine scores normal transfers as safe, and scams as high risk."""
    engine = FraudEngine(db)
    sender_account = db.query(Account).filter(Account.upi_id == "rohit@raksha").first()
    assert sender_account is not None

    # Normal transaction to debabratadas7557@okhdfcbank
    safe_eval = engine.analyze_transaction(
        sender_account_id=sender_account.id,
        recipient_upi_id="debabratadas7557@okhdfcbank",
        amount_rupees=500.0,
        note="Lunch split"
    )
    assert safe_eval["risk_score"] < 50
    assert safe_eval["recommended_action"] in ["APPROVE", "VERIFY"]

    # Scam transaction with urgency note and flagged recipient
    scam_eval = engine.analyze_transaction(
        sender_account_id=sender_account.id,
        recipient_upi_id="techsupport@fakeupi",
        amount_rupees=35000.0,
        note="URGENT: AnyDesk APK Remote KYC Verification fee"
    )
    assert scam_eval["risk_score"] >= 70
    assert scam_eval["recommended_action"] == "BLOCK"

def test_step5_and_6_payment_execution_flow(db: Session):
    """Test full payment lifecycle: validation, ledger deduction, receipt, idempotency."""
    payment_service = PaymentService(db)
    sender = db.query(User).filter(User.phone == "+919876543210").first()
    assert sender is not None

    sender_account = db.query(Account).filter(Account.user_id == sender.id).first()
    initial_balance = sender_account.balance_paise

    idempotency_key = f"test-flow-{uuid.uuid4().hex}"
    tx_amount_rupees = 250.0

    # 1. Execute payment
    receipt = payment_service.initiate_payment(
        sender_user=sender,
        recipient_upi_id="debabratadas7557@okhdfcbank",
        amount_rupees=tx_amount_rupees,
        idempotency_key=idempotency_key,
        note="Test automated flow"
    )

    assert receipt["status"] == "APPROVED"
    assert receipt["recipient_upi_id"] == "debabratadas7557@okhdfcbank"
    assert receipt["recipient_name"] == "Debabrata Das"
    assert receipt["recipient_bank"] == "HDFC Bank"
    assert receipt["amount_rupees"] == 250.0
    assert receipt["ledger_verified"] is True
    assert "RAKSHA-" in receipt["transaction_ref"]

    # 2. Check double-entry balance update
    db.refresh(sender_account)
    expected_balance = initial_balance - int(tx_amount_rupees * 100)
    assert sender_account.balance_paise == expected_balance

    # 3. Duplicate submission prevention (Idempotency)
    dup_receipt = payment_service.initiate_payment(
        sender_user=sender,
        recipient_upi_id="debabratadas7557@okhdfcbank",
        amount_rupees=tx_amount_rupees,
        idempotency_key=idempotency_key,
        note="Test automated flow"
    )
    assert dup_receipt["transaction_ref"] == receipt["transaction_ref"]

    # Balance remains exactly the same, no duplicate deduction
    db.refresh(sender_account)
    assert sender_account.balance_paise == expected_balance

def test_payment_blocks_unregistered_recipient(db: Session):
    """Verify payment throws 404 PaymentError for unregistered recipients."""
    payment_service = PaymentService(db)
    sender = db.query(User).filter(User.phone == "+919876543210").first()

    with pytest.raises(PaymentError) as exc_info:
        payment_service.initiate_payment(
            sender_user=sender,
            recipient_upi_id="ghost_account_xyz@nowhere",
            amount_rupees=100.0,
            idempotency_key=f"ghost-{uuid.uuid4().hex}"
        )

    assert exc_info.value.status_code == 404
    assert "does not exist in the simulated RakshaPay directory" in str(exc_info.value)
