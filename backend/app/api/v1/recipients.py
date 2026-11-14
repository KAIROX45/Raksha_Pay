from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.recipient import Recipient
from app.schemas.recipient import (
    RecipientRiskResponse,
    ReportRecipientRequest,
    ReportRecipientResponse,
)
from app.services.recipient_service import RecipientService

router = APIRouter(prefix="/recipients", tags=["Recipients"])

@router.get("/suggested")
def get_suggested_recipients(db: Session = Depends(get_db)):
    """Returns sample simulated recipients for testing."""
    recipients = db.query(Recipient).limit(10).all()
    return [r.to_dict() for r in recipients]

@router.get("/{upi_id}/risk", response_model=RecipientRiskResponse)
def check_recipient_risk(upi_id: str, db: Session = Depends(get_db)):
    """Inspects recipient risk profile before transaction submission."""
    service = RecipientService(db)
    return service.check_recipient_risk(upi_id)

@router.get("/{upi_id}/verify", response_model=RecipientRiskResponse)
def verify_recipient(upi_id: str, db: Session = Depends(get_db)):
    """
    Verifies whether a recipient UPI ID exists in the simulated RakshaPay directory.
    Returns 404 if not found in directory.
    """
    service = RecipientService(db)
    result = service.check_recipient_risk(upi_id)
    if not result.get("is_registered"):
        clean_upi = (upi_id or "").strip().lower()
        raise HTTPException(
            status_code=404,
            detail=f"Recipient UPI ID '{clean_upi}' does not exist in the simulated RakshaPay directory."
        )
    return result

@router.post("/report", response_model=ReportRecipientResponse)
def report_recipient(
    payload: ReportRecipientRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submits a security report against a suspicious UPI ID."""
    service = RecipientService(db)
    report = service.report_recipient(
        reporter_user_id=current_user.id,
        upi_id=payload.upi_id,
        reason=payload.reason,
        details=payload.details,
    )
    return {
        "success": True,
        "message": f"Security report submitted against {payload.upi_id}. Flagged for administrative investigation.",
        "report_id": report.id,
    }
