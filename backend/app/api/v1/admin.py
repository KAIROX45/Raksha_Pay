from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin, get_client_ip
from app.models.user import User
from app.schemas.admin import (
    AdminOverviewStats,
    UpdateUserStatusRequest,
    AddInvestigationNoteRequest,
)
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Operations Center"])

@router.get("/overview", response_model=AdminOverviewStats)
def get_admin_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Calculates live platform security metrics directly from database records."""
    service = AdminService(db)
    return service.get_overview_statistics()

@router.get("/transactions")
def list_admin_transactions(
    status: Optional[str] = Query(None),
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Full transaction inspection for fraud analysts."""
    service = AdminService(db)
    return service.list_transactions(status=status, search=search, limit=limit, offset=offset)

@router.get("/fraud-alerts")
def list_fraud_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Monitors incoming risk flags and active fraud cases."""
    service = AdminService(db)
    return service.list_fraud_alerts(status=status, severity=severity, limit=limit, offset=offset)

@router.post("/investigations/{alert_id}/notes")
def add_investigation_note(
    alert_id: str,
    payload: AddInvestigationNoteRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Adds analyst findings and optionally updates alert status."""
    ip_addr = get_client_ip(request)
    service = AdminService(db)
    try:
        result = service.add_investigation_note(
            alert_id=alert_id,
            admin_id=admin.id,
            note=payload.note,
            status_change=payload.status_change,
            ip_address=ip_addr,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users")
def list_admin_users(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Customer accounts directory with active balances and account statuses."""
    service = AdminService(db)
    return service.list_users(search=search, limit=limit, offset=offset)

@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Soft-suspends or reactivates user account with audit record."""
    ip_addr = get_client_ip(request)
    service = AdminService(db)
    try:
        return service.update_user_status(
            user_id=user_id,
            new_status=payload.status,
            admin_id=admin.id,
            reason=payload.reason,
            ip_address=ip_addr,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Immutable audit trail for all critical administrative and financial actions."""
    service = AdminService(db)
    return service.list_audit_logs(limit=limit, offset=offset)
