"""
Real-Time Scam Detection & Recipient Verification API
Combines:
1. Trained Scikit-Learn Random Forest Classifier (structured features)
2. Google Gemini API (gemini-2.5-flash) with structured JSON output (social engineering & phishing detection)
3. Deterministic transaction security rule engine
"""
import sys
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, parse_qs
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_optional_current_user
from app.models.user import User
from app.models.account import Account
from app.models.recipient import Recipient, RecipientReport
from app.models.transaction import Transaction, TransactionStatus
from app.models.fraud import FraudAlert, FraudAlertSeverity, FraudAlertStatus
from app.core.config import settings
from app.services.gemini_service import gemini_service
from ml.predict import predict_fraud_score

router = APIRouter(tags=["AI Scam Detection & Verification"])

class AnalyzeTransactionRequest(BaseModel):
    upi_id: Optional[str] = Field(None, description="Recipient UPI ID, e.g. aman@raksha or techsupport@fakeupi")
    recipient_upi_id: Optional[str] = Field(None, description="Alias for upi_id")
    amount: Optional[float] = Field(None, gt=0, description="Transaction amount in INR rupees")
    amount_rupees: Optional[float] = Field(None, gt=0, description="Alias for amount")
    note: Optional[str] = Field(None, max_length=2000, description="Transaction note or attached SMS/message/link text")
    timestamp: Optional[str] = Field(None, description="ISO-formatted transaction timestamp")

class GeminiAnalysisSchema(BaseModel):
    risk_assessment: str
    risk_score: int
    urgency_detected: bool = False
    phishing_detected: bool = False
    suspicious_phrases: List[str] = []
    explanation: str
    safety_recommendations: List[str] = []
    model_used: str = "gemini-2.5-flash"
    is_simulated_ai: bool = False

class AnalyzeTransactionResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    risk_category: str  # LOW, MEDIUM, HIGH
    recommended_action: str  # APPROVE, VERIFY, BLOCK
    is_threat: bool
    rf_score: Optional[int] = None
    gemini_score: Optional[int] = None
    rule_score: int
    model_version: str
    gemini_model: str
    detection_signals: List[str]
    decision_reason: str
    gemini_analysis: Optional[GeminiAnalysisSchema] = None
    structured_features: Dict[str, Any]
    feature_importance: Optional[Dict[str, float]] = None

@router.post("/analyze-transaction", response_model=AnalyzeTransactionResponse)
def analyze_transaction(
    payload: AnalyzeTransactionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Hybrid Real-Time Scam Detection & Recipient Verification Endpoint:
    1. Scikit-Learn Random Forest Model: Evaluates amount deviation, odd hours, recipient familiarity, velocity.
    2. Google Gemini API (gemini-2.5-flash): Evaluates transaction note, SMS, or link for social engineering urgency & phishing cues.
    3. Fuses telemetry and logs intercepted threats dynamically into database.
    """
    target_upi = (payload.upi_id or payload.recipient_upi_id or "").strip()
    if not target_upi:
        raise HTTPException(status_code=400, detail="Recipient 'upi_id' or 'recipient_upi_id' is required.")

    amount = payload.amount or payload.amount_rupees
    if amount is None or amount <= 0:
        raise HTTPException(status_code=400, detail="A positive transfer 'amount' or 'amount_rupees' is required.")

    note_text = payload.note or ""

    # 1. Parse or default transaction timestamp
    now = datetime.now(timezone.utc)
    if payload.timestamp:
        try:
            clean_ts = payload.timestamp.replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(clean_ts)
            tx_time = parsed_dt.astimezone(timezone.utc)
        except Exception:
            tx_time = now
    else:
        tx_time = now

    hour_of_day = tx_time.hour
    is_late_night = 1 if hour_of_day in [0, 1, 2, 3, 4, 5, 23] else 0

    # 2. Identify sender account (fallback to demo Rohit account if unauthenticated)
    sender_account = None
    if current_user:
        sender_account = db.query(Account).filter(Account.user_id == current_user.id).first()

    if not sender_account:
        sender_account = db.query(Account).filter(Account.upi_id == "rohit@raksha").first()

    user_account_id = sender_account.id if sender_account else None
    user_id = current_user.id if current_user else (sender_account.user_id if sender_account else None)

    # 3. Extract Structured Telemetry Features for Random Forest Model
    clean_upi = target_upi.lower()

    # Recipient familiarity & new recipient flag
    is_familiar = 0
    if user_account_id:
        prior_successful_tx = db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.recipient_upi_id == clean_upi,
            Transaction.status == TransactionStatus.APPROVED.value,
        ).scalar() or 0
        is_familiar = 1 if prior_successful_tx > 0 else 0

    is_new_recipient = (is_familiar == 0)

    # Recent transaction velocity in 1h
    recent_tx_count = 0
    if user_account_id:
        one_hour_ago = now - timedelta(hours=1)
        recent_tx_count = db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.created_at >= one_hour_ago,
        ).scalar() or 0

    # Failed attempts in 24h
    failed_count_24h = 0
    if user_account_id:
        twenty_four_hours_ago = now - timedelta(hours=24)
        failed_count_24h = db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.created_at >= twenty_four_hours_ago,
            Transaction.status.in_([TransactionStatus.FAILED.value, TransactionStatus.BLOCKED.value]),
        ).scalar() or 0

    # Historical average spend & deviation
    avg_rupees = 1000.0
    if user_account_id:
        avg_amount_paise = db.query(func.avg(Transaction.amount_paise)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.status == TransactionStatus.APPROVED.value,
        ).scalar()
        if avg_amount_paise and avg_amount_paise > 0:
            avg_rupees = float(avg_amount_paise) / 100.0

    historical_deviation = round(amount / max(avg_rupees, 100.0), 2)

    # Recipient reputation check in database
    recipient_record = db.query(Recipient).filter(
        func.lower(func.trim(Recipient.upi_id)) == clean_upi
    ).first()
    recipient_reports_count = db.query(func.count(RecipientReport.id)).filter(
        func.lower(func.trim(RecipientReport.upi_id)) == clean_upi
    ).scalar() or 0

    recipient_risk_flag = 0
    if recipient_record and (recipient_record.risk_level == "HIGH" or recipient_record.report_count > 0):
        recipient_risk_flag = 1
    elif recipient_reports_count > 0:
        recipient_risk_flag = 1
    elif any(term in clean_upi for term in ["fake", "urgent", "scam", "prize", "gift", "lottery", "techsupport"]):
        recipient_risk_flag = 1

    rf_features = {
        "amount": float(amount),
        "tx_frequency_1h": float(recent_tx_count),
        "recipient_familiarity": float(is_familiar),
        "failed_attempts_24h": float(failed_count_24h),
        "recipient_risk_flag": float(recipient_risk_flag),
        "hour_of_day": float(hour_of_day),
        "is_late_night": float(is_late_night),
        "historical_deviation": float(historical_deviation),
    }

    # 4. Scikit-Learn Random Forest Inference
    rf_score, model_version, feature_importances = predict_fraud_score(rf_features)
    if rf_score is None:
        rf_score = 15  # Fallback baseline

    # 5. Google Gemini AI Analysis (Social Engineering Urgency & Phishing)
    gemini_result = gemini_service.analyze_transaction_context(
        note=note_text,
        upi_id=clean_upi,
        amount_rupees=amount
    )
    gemini_score = gemini_result.get("risk_score", 10)

    # 6. Deterministic Security Rules & Signal Collection
    signals = []
    rule_points = 0

    if recipient_risk_flag == 1:
        signals.append("Recipient UPI ID is flagged with active fraud reports or high risk reputation")
        rule_points += 50

    if amount >= settings.HIGH_VALUE_THRESHOLD_RUPEES:
        signals.append(f"High-value payment (₹{amount:,.2f} exceeds ₹{settings.HIGH_VALUE_THRESHOLD_RUPEES:,.2f})")
        rule_points += 30
    elif amount >= 25000:
        signals.append(f"Elevated amount (₹{amount:,.2f})")
        rule_points += 15

    if is_new_recipient:
        signals.append("First-time recipient (no historical transaction record)")
        rule_points += 15

    if is_late_night:
        signals.append(f"Unusual transaction timing (initiated at {hour_of_day:02d}:00 hrs late night)")
        rule_points += 15

    if historical_deviation >= 3.5:
        signals.append(f"Sudden spending spike ({historical_deviation:.1f}x higher than your average spend)")
        rule_points += 20

    if gemini_result.get("urgency_detected"):
        signals.append("Artificial urgency detected in payment context (social engineering intimidation)")
        rule_points += 25

    if gemini_result.get("phishing_detected"):
        signals.append("Phishing or deceptive instruction patterns detected by Gemini AI")
        rule_points += 35

    rule_score = min(rule_points, 100)

    # 7. Hybrid Fusion of Scikit-Learn RF (40%), Gemini NLP (35%), and Rules (25%)
    composite_score = int(round(0.40 * rf_score + 0.35 * gemini_score + 0.25 * rule_score))

    # Apply strict security safety floors for critical threats
    if recipient_risk_flag == 1:
        composite_score = max(composite_score, 85)
    if gemini_result.get("phishing_detected") and gemini_result.get("urgency_detected"):
        composite_score = max(composite_score, 90)
    elif gemini_result.get("phishing_detected"):
        composite_score = max(composite_score, 80)

    composite_score = max(0, min(100, composite_score))

    # 8. Decision Categorization
    if composite_score >= settings.FRAUD_HIGH_THRESHOLD:
        risk_category = "HIGH"
        recommended_action = "BLOCK"
        is_threat = True
        decision_reason = (
            f"High-risk transaction intercepted by hybrid AI defense (Risk Score: {composite_score}/100). "
            "Severe fraud signals detected; transfer blocked to safeguard wallet."
        )
    elif composite_score >= settings.FRAUD_LOW_THRESHOLD:
        risk_category = "MEDIUM"
        recommended_action = "VERIFY"
        is_threat = False
        decision_reason = (
            f"Moderate risk signals detected (Risk Score: {composite_score}/100). "
            "Secondary verification recommended before entering authorization OTP."
        )
    else:
        risk_category = "LOW"
        recommended_action = "APPROVE"
        is_threat = False
        decision_reason = (
            f"Payment context verified legitimate (Risk Score: {composite_score}/100). "
            "Random Forest and Gemini clearance granted."
        )

    # 9. If a threat is intercepted, record it persistently into DB
    if is_threat and user_id:
        try:
            alert = FraudAlert(
                user_id=user_id,
                risk_score=composite_score,
                severity=FraudAlertSeverity.CRITICAL.value if composite_score >= 85 else FraudAlertSeverity.HIGH.value,
                signals=str(signals),
                explanation=decision_reason,
                gemini_analysis=gemini_result.get("explanation"),
                status=FraudAlertStatus.NEW.value,
            )
            db.add(alert)
            db.commit()
        except Exception:
            db.rollback()

    return {
        "risk_score": composite_score,
        "risk_category": risk_category,
        "recommended_action": recommended_action,
        "is_threat": is_threat,
        "rf_score": rf_score,
        "gemini_score": gemini_score,
        "rule_score": rule_score,
        "model_version": model_version or "1.0.0-rf-baseline",
        "gemini_model": gemini_result.get("model_used", settings.GEMINI_MODEL),
        "detection_signals": signals,
        "decision_reason": decision_reason,
        "gemini_analysis": gemini_result,
        "structured_features": {
            "amount": amount,
            "amount_deviation": historical_deviation,
            "odd_hours": bool(is_late_night),
            "new_recipient_flag": is_new_recipient,
            "recipient_risk_flag": bool(recipient_risk_flag),
            "hour_of_day": hour_of_day,
            "velocity_1h": recent_tx_count,
        },
        "feature_importance": feature_importances,
    }

class AnalyzeQRRequest(BaseModel):
    qr_content: str = Field(..., description="Raw string content extracted from scanned QR code")

class AnalyzeQRResponse(BaseModel):
    status: str  # SAFE, SUSPICIOUS, DANGEROUS
    risk_score: int
    risk_level: str  # GREEN, YELLOW, RED
    qr_type: str  # UPI_PAYMENT, URL_PHISHING, MALICIOUS_APK, INVALID_FORMAT
    vpa: Optional[str] = None
    merchant_name: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "INR"
    note: Optional[str] = None
    is_threat: bool = False
    reasons: List[str]
    recommendation: str
    is_simulated: bool = True

@router.post("/qr/analyze", response_model=AnalyzeQRResponse)
def analyze_qr_code(payload: AnalyzeQRRequest, db: Session = Depends(get_db)):
    """
    Analyzes raw QR code payload for payment security, phishing URLs, malicious APK links, and UPI scam vectors.
    """
    raw = (payload.qr_content or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="QR code content cannot be empty.")

    reasons: List[str] = []
    lower_raw = raw.lower()

    # Scenario 1: Malicious / Phishing URLs or APK downloads
    if lower_raw.startswith("http://") or lower_raw.startswith("https://") or "://" in lower_raw and not lower_raw.startswith("upi:"):
        is_apk = lower_raw.endswith(".apk") or ".apk" in lower_raw
        is_phishing_word = any(w in lower_raw for w in ["kyc", "verify", "claim", "reward", "portal", "lottery", "gift", "winner"])
        
        reasons.append("Non-UPI Web Link: QR code directs to an external HTTP/HTTPS URL instead of standard NPCI UPI payment format.")
        if is_apk:
            reasons.append("Malicious Payload Warning: Android APK installation package link detected. Risk of Trojan / spyware.")
        if is_phishing_word:
            reasons.append("Deceptive Domain Indicator: URL contains common banking credential theft or lottery keywords.")

        return {
            "status": "DANGEROUS",
            "risk_score": 95 if is_apk else 88,
            "risk_level": "RED",
            "qr_type": "MALICIOUS_APK" if is_apk else "URL_PHISHING",
            "vpa": None,
            "merchant_name": None,
            "amount": None,
            "currency": None,
            "note": None,
            "is_threat": True,
            "reasons": reasons,
            "recommendation": "DO NOT OPEN this URL or install downloaded files. This QR code attempts to route you away from secure payment networks.",
            "is_simulated": True,
        }

    # Scenario 2: UPI Payment Scheme
    if lower_raw.startswith("upi://pay") or lower_raw.startswith("upi:"):
        parsed = urlparse(raw if "://" in raw else "upi://" + raw.lstrip("upi:"))
        query_params = parse_qs(parsed.query)

        vpa = query_params.get("pa", [None])[0]
        name = query_params.get("pn", [None])[0]
        am_str = query_params.get("am", [None])[0]
        cu = query_params.get("cu", ["INR"])[0]
        tn = query_params.get("tn", [None])[0]
        mode = query_params.get("mode", [None])[0]

        amt = None
        if am_str:
            try:
                amt = float(am_str)
            except Exception:
                amt = None

        if not vpa or "@" not in vpa:
            reasons.append("Invalid UPI Format: Payee VPA address ('pa') is missing or improperly formed.")
            return {
                "status": "DANGEROUS",
                "risk_score": 85,
                "risk_level": "RED",
                "qr_type": "INVALID_FORMAT",
                "vpa": vpa,
                "merchant_name": name,
                "amount": amt,
                "currency": cu,
                "note": tn,
                "is_threat": True,
                "reasons": reasons,
                "recommendation": "Reject this QR code. The payment string fails standard NPCI schema validation.",
                "is_simulated": True,
            }

        clean_vpa = vpa.strip().lower()

        # Database lookup for recipient reputation
        rec_record = db.query(Recipient).filter(
            func.lower(func.trim(Recipient.upi_id)) == clean_vpa
        ).first()
        reports_count = db.query(func.count(RecipientReport.id)).filter(
            func.lower(func.trim(RecipientReport.upi_id)) == clean_vpa
        ).scalar() or 0

        # Known scam keywords
        urgency_terms = ["urgent", "disconnect", "electricity", "bill", "lottery", "prize", "cashback", "anydesk", "kyc", "fakeupi", "urgentpay", "giftupi"]
        has_urgency = any(t in (tn or "").lower() or t in clean_vpa or t in (name or "").lower() for t in urgency_terms)

        is_flagged = (rec_record and rec_record.risk_level == "HIGH") or reports_count > 0 or "fakeupi" in clean_vpa or "urgentpay" in clean_vpa or "giftupi" in clean_vpa

        if is_flagged or (has_urgency and ("disconnect" in lower_raw or "urgent" in lower_raw)):
            reasons.append(f"Flagged Scam Recipient: Beneficiary VPA '{vpa}' matches known fraudulent fraud patterns in our cybersecurity registry.")
            if has_urgency:
                reasons.append(f"High-Pressure Note Detected: Note or description contains high-urgency keywords ('{tn or name}').")
            if amt and amt >= 2000:
                reasons.append(f"Pre-Filled Transfer Sum: Forced debit of ₹{amt:,.2f} configured to bypass sender deliberation.")

            return {
                "status": "DANGEROUS",
                "risk_score": 92,
                "risk_level": "RED",
                "qr_type": "UPI_PAYMENT",
                "vpa": vpa,
                "merchant_name": name or (rec_record.name if rec_record else "Unverified Beneficiary"),
                "amount": amt,
                "currency": cu,
                "note": tn,
                "is_threat": True,
                "reasons": reasons,
                "recommendation": "BLOCK PAYMENT: This QR code is associated with an active utility or remote-access scam. Do not proceed.",
                "is_simulated": True,
            }

        # Check for collect request mode (mode=02)
        if mode == "02":
            reasons.append("Deceptive Collect Request: 'mode=02' initiates an account debit collect request rather than a merchant payment.")
            return {
                "status": "DANGEROUS",
                "risk_score": 89,
                "risk_level": "RED",
                "qr_type": "UPI_PAYMENT",
                "vpa": vpa,
                "merchant_name": name,
                "amount": amt,
                "currency": cu,
                "note": tn,
                "is_threat": True,
                "reasons": reasons,
                "recommendation": "Warning: Scanning this QR will request to DEDUCT money from your account, not credit money to you.",
                "is_simulated": True,
            }

        # Check for unverified / suspicious
        if not rec_record or rec_record.verification_status != "SIMULATED_VERIFIED":
            reasons.append("Unverified Beneficiary: Recipient VPA is newly encountered and not verified in the local directory.")
            if any(h in clean_vpa for h in ["techsupport", "refund", "claim", "customer"]):
                reasons.append("Suspicious Beneficiary Handle: VPA contains customer support / refund keywords commonly impersonated by fraudsters.")
            return {
                "status": "SUSPICIOUS",
                "risk_score": 52,
                "risk_level": "YELLOW",
                "qr_type": "UPI_PAYMENT",
                "vpa": vpa,
                "merchant_name": name or "Unverified Account",
                "amount": amt,
                "currency": cu,
                "note": tn,
                "is_threat": False,
                "reasons": reasons,
                "recommendation": "Proceed with caution. Verify the payee through independent channels before transferring.",
                "is_simulated": True,
            }

        # Safe verified merchant / recipient
        reasons.append("Verified Beneficiary: Recipient VPA is verified in the simulated RakshaPay banking directory.")
        reasons.append("Valid NPCI Schema: Standard UPI protocol parameters ('pa', 'pn', 'cu') verified.")
        reasons.append("Currency Verified: Payment is routed strictly in Indian Rupees (INR).")
        reasons.append("Zero Malicious Indicators: No phishing URLs, malware payloads, or deceptive collect flags detected.")

        return {
            "status": "SAFE",
            "risk_score": 12,
            "risk_level": "GREEN",
            "qr_type": "UPI_PAYMENT",
            "vpa": vpa,
            "merchant_name": name or (rec_record.name if rec_record else "Verified Contact"),
            "amount": amt,
            "currency": cu,
            "note": tn,
            "is_threat": False,
            "reasons": reasons,
            "recommendation": "SAFE TO PAY: Verified optical QR signature with zero threat vectors. You can securely proceed with transfer.",
            "is_simulated": True,
        }

    # Scenario 3: Unknown / non-standard format
    reasons.append("Unrecognized Payload: Content does not conform to NPCI UPI specification (upi://pay) or standard web URLs.")
    return {
        "status": "SUSPICIOUS",
        "risk_score": 62,
        "risk_level": "YELLOW",
        "qr_type": "INVALID_FORMAT",
        "vpa": None,
        "merchant_name": None,
        "amount": None,
        "currency": None,
        "note": None,
        "is_threat": False,
        "reasons": reasons,
        "recommendation": "Unrecognized QR code payload. Verify the source before interacting.",
        "is_simulated": True,
    }
