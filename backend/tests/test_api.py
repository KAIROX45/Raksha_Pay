"""
Comprehensive Test Suite for RakshaPay Backend
Verifies Authentication, Payments, Double-Entry Ledger, Fraud Engine, and Admin RBAC.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.api.deps import get_db
from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.models.account import Account
from app.models.recipient import Recipient
from app.core.security import get_password_hash

from sqlalchemy.pool import StaticPool

# Dedicated shared in-memory database with StaticPool so all threads/sessions share the same DB
TEST_DATABASE_URL = "sqlite://"
engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="session")
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    
    # Create test customer: Rohit
    rohit = User(
        id="test-rohit-id",
        phone="+919876543210",
        full_name="Rohit Sharma [TEST]",
        role=UserRole.USER.value,
        status=UserStatus.ACTIVE.value,
    )
    db.add(rohit)
    db.flush()

    account_rohit = Account(
        id="test-rohit-acc",
        user_id=rohit.id,
        upi_id="rohit@raksha",
        account_number="ACC98765401",
        balance_paise=5000000,  # ₹50,000.00
        currency="INR",
        status="ACTIVE",
    )
    db.add(account_rohit)

    # Create test recipient: Aman
    aman = User(
        id="test-aman-id",
        phone="+919876543211",
        full_name="Aman Gupta [TEST]",
        role=UserRole.USER.value,
        status=UserStatus.ACTIVE.value,
    )
    db.add(aman)
    db.flush()

    account_aman = Account(
        id="test-aman-acc",
        user_id=aman.id,
        upi_id="aman@raksha",
        account_number="ACC98765402",
        balance_paise=1000000,  # ₹10,000.00
        currency="INR",
        status="ACTIVE",
    )
    db.add(account_aman)

    # Add recipients
    rec_clean = Recipient(
        upi_id="aman@raksha",
        name="Aman Gupta",
        account_age_days=180,
        risk_level="LOW",
        report_count=0,
        verification_status="SIMULATED_VERIFIED",
    )
    db.add(rec_clean)

    rec_scam = Recipient(
        upi_id="techsupport@fakeupi",
        name="Global Tech Support Impersonator",
        account_age_days=2,
        risk_level="HIGH",
        report_count=5,
        verification_status="FLAGGED_SUSPICIOUS",
    )
    db.add(rec_scam)

    # Create test admin
    admin = User(
        id="test-admin-id",
        phone="+919999900000",
        full_name="SOC Lead [TEST]",
        role=UserRole.ADMIN.value,
        status=UserStatus.ACTIVE.value,
        password_hash=get_password_hash("Admin@Raksha2026"),
    )
    db.add(admin)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def client(setup_db):
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_verify_otp_success(client):
    res = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "+919876543210"

def test_auth_verify_otp_incorrect(client):
    res = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "000000",
    })
    assert res.status_code == 400
    assert "Incorrect OTP" in res.json()["detail"]

def test_admin_login_success(client):
    res = client.post("/api/auth/admin/login", json={
        "phone": "+919999900000",
        "password": "Admin@Raksha2026",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"

def test_admin_login_invalid_password(client):
    res = client.post("/api/auth/admin/login", json={
        "phone": "+919999900000",
        "password": "WrongPassword123",
    })
    assert res.status_code == 401

def test_rbac_user_cannot_access_admin_overview(client):
    # Log in as normal user
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    res = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_payment_success_atomic_ledger(client):
    # Log in as Rohit
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    # Check initial balance
    bal_res = client.get("/api/accounts/balance", headers={"Authorization": f"Bearer {token}"})
    initial_balance = bal_res.json()["balance_rupees"]

    # Send ₹500 to aman@raksha
    import uuid
    idemp_key = f"test-idemp-{uuid.uuid4().hex}"
    tx_res = client.post(
        "/api/transactions/initiate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "recipient_upi_id": "aman@raksha",
            "amount_rupees": 500.0,
            "idempotency_key": idemp_key,
            "note": "Lunch split",
        }
    )
    assert tx_res.status_code == 200
    tx_data = tx_res.json()
    assert tx_data["status"] == "APPROVED"
    assert tx_data["amount_rupees"] == 500.0
    assert tx_data["ledger_verified"] is True

    # Check new balance: should be exactly initial_balance - 500.0
    bal_res_after = client.get("/api/accounts/balance", headers={"Authorization": f"Bearer {token}"})
    assert bal_res_after.json()["balance_rupees"] == initial_balance - 500.0

def test_payment_idempotency_prevents_duplicate_debit(client):
    # Log in as Rohit
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    import uuid
    shared_key = f"same-key-{uuid.uuid4().hex}"
    payload = {
        "recipient_upi_id": "aman@raksha",
        "amount_rupees": 100.0,
        "idempotency_key": shared_key,
        "note": "First attempt",
    }

    # First request
    res1 = client.post("/api/transactions/initiate", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert res1.status_code == 200
    ref1 = res1.json()["transaction_ref"]

    # Duplicate request with same idempotency key
    res2 = client.post("/api/transactions/initiate", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert res2.status_code == 200
    ref2 = res2.json()["transaction_ref"]

    # Must return exact same transaction reference without second debit
    assert ref1 == ref2

def test_payment_insufficient_balance(client):
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    import uuid
    res = client.post(
        "/api/transactions/initiate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "recipient_upi_id": "aman@raksha",
            "amount_rupees": 99999999.0,
            "idempotency_key": f"insufficient-{uuid.uuid4().hex}",
        }
    )
    assert res.status_code == 400
    assert "Insufficient funds" in res.json()["detail"]

def test_payment_blocked_for_scammer_recipient(client):
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    import uuid
    res = client.post(
        "/api/transactions/initiate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "recipient_upi_id": "techsupport@fakeupi",
            "amount_rupees": 30000.0,
            "idempotency_key": f"scam-{uuid.uuid4().hex}",
            "note": "Antivirus scam",
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "BLOCKED"
    assert data["risk_score"] >= 70
    assert data["ledger_verified"] is False

def test_analyze_transaction_safe(client):
    res = client.post("/api/analyze-transaction", json={
        "upi_id": "aman@raksha",
        "amount": 500.0,
        "note": "Lunch payment",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["risk_category"] == "LOW"
    assert data["recommended_action"] == "APPROVE"
    assert data["is_threat"] is False
    assert "rf_score" in data
    assert "gemini_score" in data
    assert "model_version" in data

def test_analyze_transaction_scam_intercepted(client):
    res = client.post("/api/analyze-transaction", json={
        "upi_id": "techsupport@fakeupi",
        "amount": 25000.0,
        "note": "URGENT electricity disconnect tonight pay immediately or download AnyDesk APK",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["is_threat"] is True
    assert data["risk_category"] == "HIGH"
    assert data["recommended_action"] == "BLOCK"
    assert data["risk_score"] >= 70
    assert len(data["detection_signals"]) > 0
    assert data["gemini_analysis"]["phishing_detected"] is True

def test_wallet_topup_double_entry_ledger(client):
    res_user = client.post("/api/auth/verify-otp", json={
        "phone": "+919876543210",
        "otp": "123456",
    })
    token = res_user.json()["access_token"]

    # Initial summary
    res_before = client.get("/api/wallet/summary", headers={"Authorization": f"Bearer {token}"})
    assert res_before.status_code == 200
    before_tx_count = res_before.json()["total_transactions"]
    before_approved = res_before.json()["approved_transfers"]
    before_balance = res_before.json()["available_balance_rupees"]

    # Topup ₹10,000 demo
    res_topup = client.post(
        "/api/wallet/topup",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount_rupees": 10000.0}
    )
    assert res_topup.status_code == 200
    topup_data = res_topup.json()
    assert topup_data["success"] is True
    assert topup_data["amount_paise"] == 1000000
    assert len(topup_data["ledger_entries"]) == 2  # Balanced DEBIT and CREDIT

    # Verify summary updated immediately
    res_after = client.get("/api/wallet/summary", headers={"Authorization": f"Bearer {token}"})
    assert res_after.status_code == 200
    after_data = res_after.json()
    assert after_data["total_transactions"] == before_tx_count + 1
    assert after_data["approved_transfers"] == before_approved + 1
    assert after_data["available_balance_rupees"] == before_balance + 10000.0
    assert "weekly_analytics" in after_data
    assert "weekly_anomaly_index" in after_data
