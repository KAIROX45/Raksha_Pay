import pytest
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.api.v1.analyze import analyze_qr_code, AnalyzeQRRequest
from fastapi import HTTPException

@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_qr_safe_merchant(db: Session):
    """Test standard valid merchant UPI QR returns GREEN (Safe)."""
    payload = AnalyzeQRRequest(
        qr_content="upi://pay?pa=quickmart@upi&pn=QuickMart%20Daily%20Needs&mc=5411&cu=INR&tn=Store%20Purchase"
    )
    result = analyze_qr_code(payload, db)
    assert result["status"] == "SAFE"
    assert result["risk_level"] == "GREEN"
    assert result["risk_score"] <= 25
    assert result["vpa"] == "quickmart@upi"
    assert result["merchant_name"] == "QuickMart Daily Needs"
    assert result["is_threat"] is False
    assert any("Verified Beneficiary" in r for r in result["reasons"])

def test_qr_electricity_scam(db: Session):
    """Test electricity extortion scam QR returns RED (Dangerous)."""
    payload = AnalyzeQRRequest(
        qr_content="upi://pay?pa=electricityboard@urgentpay&pn=Electricity%20Urgent%20Disconnect&am=4850.00&cu=INR&tn=URGENT%20BILL%20DISCONNECT%20NOTICE"
    )
    result = analyze_qr_code(payload, db)
    assert result["status"] == "DANGEROUS"
    assert result["risk_level"] == "RED"
    assert result["risk_score"] >= 70
    assert result["is_threat"] is True
    assert result["amount"] == 4850.0
    assert any("Flagged Scam Recipient" in r for r in result["reasons"])

def test_qr_phishing_apk_url(db: Session):
    """Test non-UPI phishing URL downloading malicious APK returns RED (Dangerous)."""
    payload = AnalyzeQRRequest(
        qr_content="https://bank-kyc-verify-portal.in/secure-kyc-update.apk"
    )
    result = analyze_qr_code(payload, db)
    assert result["status"] == "DANGEROUS"
    assert result["risk_level"] == "RED"
    assert result["risk_score"] >= 90
    assert result["qr_type"] == "MALICIOUS_APK"
    assert result["is_threat"] is True
    assert any("Non-UPI Web Link" in r for r in result["reasons"])
    assert any("Malicious Payload Warning" in r for r in result["reasons"])

def test_qr_suspicious_payment(db: Session):
    """Test unverified service handle returns YELLOW (Suspicious)."""
    payload = AnalyzeQRRequest(
        qr_content="upi://pay?pa=customerdesk@unverifiedservice&pn=Refund%20Disbursement%20Desk&cu=INR&tn=Processing%20Support%20Fee"
    )
    result = analyze_qr_code(payload, db)
    assert result["status"] == "SUSPICIOUS"
    assert result["risk_level"] == "YELLOW"
    assert 30 <= result["risk_score"] <= 69
    assert result["is_threat"] is False
    assert any("Unverified Beneficiary" in r for r in result["reasons"])

def test_qr_collect_request_deception(db: Session):
    """Test deceptive collect request (mode=02) masquerading as pay is flagged RED."""
    payload = AnalyzeQRRequest(
        qr_content="upi://pay?pa=scammer@axisbank&pn=Prize%20Disbursement&mode=02&am=5000&cu=INR"
    )
    result = analyze_qr_code(payload, db)
    assert result["status"] == "DANGEROUS"
    assert result["risk_level"] == "RED"
    assert result["is_threat"] is True
    assert any("Deceptive Collect Request" in r for r in result["reasons"])

def test_qr_empty_content_rejected(db: Session):
    """Test empty QR content throws 400 HTTPException."""
    payload = AnalyzeQRRequest(qr_content="   ")
    with pytest.raises(HTTPException) as exc:
        analyze_qr_code(payload, db)
    assert exc.value.status_code == 400
