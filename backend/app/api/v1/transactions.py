from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, get_client_ip
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction import (
    InitiatePaymentRequest,
    TransactionResponse,
    TransactionReceiptResponse,
)
from app.services.payment_service import PaymentService, PaymentError
from app.services.recipient_service import get_bank_for_upi

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/initiate")
def initiate_payment(
    payload: InitiatePaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes the 11-step payment lifecycle:
    Validation -> Fraud Analysis -> Decision -> Atomic Ledger Transfer -> Receipt.
    """
    ip_addr = get_client_ip(request)
    service = PaymentService(db)
    try:
        result = service.initiate_payment(
            sender_user=current_user,
            recipient_upi_id=payload.recipient_upi_id,
            amount_rupees=payload.amount_rupees,
            idempotency_key=payload.idempotency_key,
            note=payload.note,
            ip_address=ip_addr,
        )
        return result
    except PaymentError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction processing error: {str(e)}")

@router.get("")
def list_transactions(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all sent and received transactions for the authenticated user."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        return []

    query = db.query(Transaction).filter(
        (Transaction.sender_account_id == account.id) |
        (Transaction.recipient_account_id == account.id) |
        (Transaction.recipient_upi_id == account.upi_id)
    )

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Transaction.status == status_filter.upper())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Transaction.transaction_ref.ilike(s)) |
            (Transaction.recipient_upi_id.ilike(s)) |
            (Transaction.recipient_name.ilike(s))
        )

    txs = query.order_by(desc(Transaction.created_at)).offset(offset).limit(limit).all()
    return [t.to_dict() for t in txs]

@router.get("/{transaction_id}")
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Inspects details of a single transaction belonging to user."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    tx = db.query(Transaction).filter(
        (Transaction.id == transaction_id) | (Transaction.transaction_ref == transaction_id)
    ).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    # Authorization check
    if tx.sender_account_id != account.id and tx.recipient_account_id != account.id and tx.recipient_upi_id != account.upi_id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this transaction.")

    return tx.to_dict()

@router.get("/{transaction_id}/receipt")
def get_transaction_receipt(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves verified transaction receipt."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    tx = db.query(Transaction).filter(
        (Transaction.id == transaction_id) | (Transaction.transaction_ref == transaction_id)
    ).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    if tx.sender_account_id != account.id and tx.recipient_account_id != account.id:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    sender_name = current_user.full_name
    sender_upi = account.upi_id

    return {
        "transaction_ref": tx.transaction_ref,
        "date_time": tx.created_at.isoformat() if tx.created_at else None,
        "amount_rupees": tx.amount_paise / 100.0,
        "amount_paise": tx.amount_paise,
        "status": tx.status,
        "sender_upi_id": sender_upi,
        "sender_name": sender_name,
        "recipient_upi_id": tx.recipient_upi_id,
        "recipient_name": tx.recipient_name,
        "recipient_bank": get_bank_for_upi(tx.recipient_upi_id),
        "risk_score": tx.risk_score,
        "risk_category": tx.risk_category,
        "decision_reason": tx.decision_reason,
        "note": tx.note,
        "ledger_verified": tx.status == "APPROVED",
        "is_simulated": True,
    }
