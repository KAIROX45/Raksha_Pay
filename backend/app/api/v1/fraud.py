from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.fraud import FraudAlert
from app.schemas.fraud import FraudAnalysisRequest, FraudAnalysisResult
from app.services.fraud_engine import FraudEngine

router = APIRouter(prefix="/fraud", tags=["Fraud Engine"])

@router.post("/analyze", response_model=FraudAnalysisResult)
def analyze_fraud_risk(
    payload: FraudAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Dry-run pre-transaction risk analysis without executing payment.
    Enables interactive risk preview in the frontend payment form.
    """
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Sender account not found.")

    engine = FraudEngine(db)
    result = engine.analyze_transaction(
        sender_account_id=account.id,
        recipient_upi_id=payload.recipient_upi_id,
        amount_rupees=payload.amount_rupees,
        note=payload.note,
    )
    return {
        "risk_score": result["risk_score"],
        "risk_category": result["risk_category"],
        "recommended_action": result["recommended_action"],
        "detection_signals": result["detection_signals"],
        "rule_score": result["rule_score"],
        "ml_score": result["ml_score"],
        "model_version": result["model_version"],
        "feature_importance": result["feature_importance"],
        "explanation": result["decision_reason"],
    }

@router.get("/alerts")
def get_user_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves fraud security alerts associated with current user."""
    alerts = db.query(FraudAlert).filter(
        FraudAlert.user_id == current_user.id
    ).order_by(desc(FraudAlert.created_at)).all()
    return [a.to_dict() for a in alerts]
