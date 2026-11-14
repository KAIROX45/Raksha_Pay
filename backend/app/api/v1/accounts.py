from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.audit import AuditLog

router = APIRouter(prefix="/accounts", tags=["Accounts"])

class DemoTopupRequest(BaseModel):
    amount_rupees: float = Field(..., gt=0, le=50000, description="Amount in INR to topup simulated balance")

@router.get("/me")
def get_my_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns simulated account details and balance for the authenticated user."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulated account not found.")
    return account.to_dict()

@router.get("/balance")
def get_balance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns integer paise balance and converted rupees."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    return {
        "balance_paise": account.balance_paise,
        "balance_rupees": account.balance_paise / 100.0,
        "currency": account.currency,
        "status": account.status,
    }

@router.post("/topup-demo")
def topup_demo_balance(payload: DemoTopupRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Allows recharging simulated demo balance using double-entry ledger bookkeeping."""
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    
    from app.services.ledger_service import LedgerService
    ledger_service = LedgerService(db)
    tx, debit_entry, credit_entry = ledger_service.execute_topup(account, amount_rupees=payload.amount_rupees)
    db.commit()
    db.refresh(account)

    return {
        "success": True,
        "message": f"Successfully added ₹{payload.amount_rupees:,.2f} demo funds to simulated wallet via double-entry ledger.",
        "transaction_ref": tx.transaction_ref,
        "amount_paise": tx.amount_paise,
        "amount_rupees": account.balance_paise / 100.0,
        "new_balance_rupees": account.balance_paise / 100.0,
        "new_balance_paise": account.balance_paise,
    }
