import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.core.database import SessionLocal
from app.services.auth_service import AuthService, normalize_phone_number
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest

@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_normalize_phone_number():
    assert normalize_phone_number("+919876543210") == "+919876543210"
    assert normalize_phone_number("9876543210") == "+919876543210"
    assert normalize_phone_number("+91 98765 43210") == "+919876543210"
    assert normalize_phone_number("+91-98765-43210") == "+919876543210"
    
    with pytest.raises(ValueError):
        normalize_phone_number("12345")
    with pytest.raises(ValueError):
        normalize_phone_number("")

def test_send_and_verify_otp(db_session):
    auth_service = AuthService(db_session)
    
    # 1. Dispatch OTP
    res = auth_service.send_otp("+919876543210")
    assert res["success"] is True
    assert res["dev_otp"] == "123456"
    assert res["phone"] == "+919876543210"

    # 2. Verify with correct demo OTP
    user, token = auth_service.verify_otp_or_token("+919876543210", otp="123456")
    assert user.phone == "+919876543210"
    assert token is not None

def test_verify_incorrect_otp(db_session):
    auth_service = AuthService(db_session)
    auth_service.send_otp("+919876543210")
    
    with pytest.raises(ValueError) as exc:
        auth_service.verify_otp_or_token("+919876543210", otp="999999")
    assert "Incorrect OTP verification code" in str(exc.value)
