from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction, TransactionStatus
from app.models.ledger import LedgerEntry, EntryType
from app.models.fraud import FraudAlert
from app.services.ledger_service import LedgerService, LedgerError

router = APIRouter(prefix="/wallet", tags=["Wallet & Ledger"])

class TopupRequest(BaseModel):
    amount_rupees: float = Field(10000.0, gt=0, le=50000.0, description="Amount in INR to topup")

class TopupResponse(BaseModel):
    success: bool
    message: str
    transaction_ref: str
    amount_paise: int
    amount_rupees: float
    new_balance_paise: int
    new_balance_rupees: float
    ledger_entries: List[Dict[str, Any]]

@router.post("/topup", response_model=TopupResponse)
def wallet_topup(
    payload: Optional[TopupRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes an atomic double-entry demo top-up from the Reserve Vault (Mint):
    - DEBIT on Reserve Vault Account (reserve.vault@raksha)
    - CREDIT on User Account
    - Balance tracked strictly in integer paise for precision.
    """
    amount = payload.amount_rupees if payload else 10000.0
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    ledger_service = LedgerService(db)
    try:
        tx, debit_entry, credit_entry = ledger_service.execute_topup(account, amount_rupees=amount)
        db.commit()
        db.refresh(account)
    except LedgerError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Top-up ledger error: {str(e)}")

    return {
        "success": True,
        "message": f"Successfully minted ₹{amount:,.2f} demo balance into simulated wallet via double-entry ledger.",
        "transaction_ref": tx.transaction_ref,
        "amount_paise": tx.amount_paise,
        "amount_rupees": tx.amount_paise / 100.0,
        "new_balance_paise": account.balance_paise,
        "new_balance_rupees": account.balance_paise / 100.0,
        "ledger_entries": [debit_entry.to_dict(), credit_entry.to_dict()],
    }

@router.get("/summary")
def get_wallet_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns authentic summary metrics for the user dashboard:
    - Available balance (paise & rupees)
    - Total transactions
    - Approved transfers
    - Blocked transfers
    - Intercepted threats count (blocked txs + fraud alerts)
    - Real 7-day double-entry financial analytics data
    - Weekly anomaly index
    """
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    # 1. Transactions associated with this user
    user_tx_query = db.query(Transaction).filter(
        or_(
            Transaction.sender_account_id == account.id,
            Transaction.recipient_account_id == account.id,
            Transaction.recipient_upi_id == account.upi_id,
        )
    )

    total_transactions = user_tx_query.count()
    approved_transfers = user_tx_query.filter(Transaction.status == TransactionStatus.APPROVED.value).count()
    blocked_transfers = user_tx_query.filter(Transaction.status == TransactionStatus.BLOCKED.value).count()
    pending_transfers = user_tx_query.filter(Transaction.status == TransactionStatus.PENDING.value).count()

    # 2. Fraud alerts / threats intercepted for this user
    user_fraud_alerts = db.query(func.count(FraudAlert.id)).filter(
        FraudAlert.user_id == current_user.id
    ).scalar() or 0

    threats_intercepted = max(blocked_transfers, user_fraud_alerts)

    # 3. 7-Day Rolling Financial Analytics Aggregation (Double-Entry Ledger)
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    
    weekly_analytics = []
    daily_expenses: List[float] = []

    # Map past 7 days (e.g. from 6 days ago up to today)
    for i in range(6, -1, -1):
        day_date = today_start - timedelta(days=i)
        next_day = day_date + timedelta(days=1)
        day_label = day_date.strftime("%a")  # Mon, Tue, etc.
        date_str = day_date.strftime("%Y-%m-%d")

        # Income: credits to user account on this day
        day_credit_paise = db.query(func.sum(LedgerEntry.amount_paise)).filter(
            LedgerEntry.account_id == account.id,
            LedgerEntry.entry_type == EntryType.CREDIT.value,
            LedgerEntry.created_at >= day_date,
            LedgerEntry.created_at < next_day,
        ).scalar() or 0

        # Expense: debits from user account on this day
        day_debit_paise = db.query(func.sum(LedgerEntry.amount_paise)).filter(
            LedgerEntry.account_id == account.id,
            LedgerEntry.entry_type == EntryType.DEBIT.value,
            LedgerEntry.created_at >= day_date,
            LedgerEntry.created_at < next_day,
        ).scalar() or 0

        income_rupees = round(float(day_credit_paise) / 100.0, 2)
        expense_rupees = round(float(day_debit_paise) / 100.0, 2)

        # If zero transactions on this day in demo, provide realistic non-zero baseline curve
        # but always reflect real transactions when present
        weekly_analytics.append({
            "day": day_label,
            "date": date_str,
            "income": income_rupees,
            "expense": expense_rupees,
        })
        daily_expenses.append(expense_rupees)

    # 4. Weekly Anomaly Index computation based on standard deviation
    n = len(daily_expenses)
    mean_expense = sum(daily_expenses) / n if n > 0 else 0.0
    variance = sum((x - mean_expense) ** 2 for x in daily_expenses) / n if n > 0 else 0.0
    std_dev = math.sqrt(variance)

    latest_expense = daily_expenses[-1] if daily_expenses else 0.0
    z_score = round(abs(latest_expense - mean_expense) / std_dev, 2) if std_dev > 0 else 0.0

    if z_score <= 1.0 or std_dev == 0:
        anomaly_status = "Optimal"
        anomaly_message = "Weekly spend is fully consistent with your normal financial baseline."
    elif z_score <= 2.0:
        anomaly_status = "Moderate Variance"
        anomaly_message = f"Moderate variance detected ({z_score:.1f}σ from weekly mean spend)."
    else:
        anomaly_status = "Elevated Spend Spike"
        anomaly_message = f"Significant spending spike detected ({z_score:.1f}σ above historical average)."

    return {
        "available_balance_paise": account.balance_paise,
        "available_balance_rupees": account.balance_paise / 100.0,
        "total_transactions": total_transactions,
        "approved_transfers": approved_transfers,
        "blocked_transfers": blocked_transfers,
        "pending_transfers": pending_transfers,
        "threats_intercepted": threats_intercepted,
        "weekly_analytics": weekly_analytics,
        "weekly_anomaly_index": {
            "status": anomaly_status,
            "std_dev_rupees": round(std_dev, 2),
            "mean_expense_rupees": round(mean_expense, 2),
            "z_score": z_score,
            "message": anomaly_message,
        },
    }
