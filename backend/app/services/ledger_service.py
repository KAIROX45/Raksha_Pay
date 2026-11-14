"""
Double-Entry Ledger Service
Executes atomic, balanced debit and credit entries with strict monetary precision (integer paise).
"""
from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.logging import logger
from app.models.account import Account
from app.models.ledger import LedgerEntry, EntryType
from app.models.transaction import Transaction

class LedgerError(Exception):
    pass

class InsufficientBalanceError(LedgerError):
    pass

class LedgerService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_system_mint_account(self) -> Account:
        """Finds or initializes the Reserve Vault Mint Account."""
        mint = self.db.query(Account).filter(Account.upi_id == "reserve.vault@raksha").first()
        if not mint:
            from app.models.user import User, UserRole, UserStatus
            vault_user = self.db.query(User).filter(User.phone == "+910000000000").first()
            if not vault_user:
                vault_user = User(
                    phone="+910000000000",
                    full_name="RakshaPay Reserve Vault",
                    email="reserve.vault@rakshapay.in",
                    role=UserRole.ADMIN.value,
                    status=UserStatus.ACTIVE.value,
                    is_demo=True,
                )
                self.db.add(vault_user)
                self.db.flush()

            mint = Account(
                user_id=vault_user.id,
                upi_id="reserve.vault@raksha",
                account_number="999000000001",
                ifsc_code="RAKS0000MNT",
                balance_paise=100_000_000_000,  # ₹1,000,000,000.00
                currency="INR",
                status="ACTIVE",
            )
            self.db.add(mint)
            self.db.flush()
        return mint

    def get_or_create_external_settlement_account(self) -> Account:
        """Finds or initializes the external merchant settlement pool account."""
        pool = self.db.query(Account).filter(Account.upi_id == "merchant.settlement@raksha").first()
        if not pool:
            from app.models.user import User, UserRole, UserStatus
            pool_user = self.db.query(User).filter(User.phone == "+910000000001").first()
            if not pool_user:
                pool_user = User(
                    phone="+910000000001",
                    full_name="External Merchant Settlement Pool",
                    email="settlement.pool@rakshapay.in",
                    role=UserRole.ADMIN.value,
                    status=UserStatus.ACTIVE.value,
                    is_demo=True,
                )
                self.db.add(pool_user)
                self.db.flush()

            pool = Account(
                user_id=pool_user.id,
                upi_id="merchant.settlement@raksha",
                account_number="999000000002",
                ifsc_code="RAKS0000EXT",
                balance_paise=0,
                currency="INR",
                status="ACTIVE",
            )
            self.db.add(pool)
            self.db.flush()
        return pool

    def execute_topup(
        self,
        user_account: Account,
        amount_rupees: float = 10000.0,
    ) -> Tuple[Transaction, LedgerEntry, LedgerEntry]:
        """
        Executes atomic double-entry demo top-up from Reserve Vault:
        1. Debits System Mint Account (reserve.vault@raksha)
        2. Credits User's Account
        3. Writes balanced DEBIT and CREDIT ledger entries
        4. Increments total transaction and approved transfer history
        """
        import uuid
        from datetime import datetime, timezone
        from app.models.transaction import TransactionStatus, RiskCategory
        from app.models.audit import AuditLog
        from app.models.notification import Notification

        amount_paise = int(round(amount_rupees * 100))
        if amount_paise <= 0:
            raise LedgerError("Topup amount must be strictly positive.")

        mint_account = self.get_or_create_system_mint_account()
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        ref = f"RAKSHA-MINT-{date_str}-{uuid.uuid4().hex[:8].upper()}"

        tx = Transaction(
            transaction_ref=ref,
            sender_account_id=mint_account.id,
            recipient_account_id=user_account.id,
            recipient_upi_id=user_account.upi_id,
            recipient_name=user_account.user.full_name if user_account.user else "Demo Customer",
            amount_paise=amount_paise,
            status=TransactionStatus.APPROVED.value,
            risk_score=0,
            risk_category=RiskCategory.LOW.value,
            decision_reason="Simulated Reserve Vault Demo Balance Top-Up (Double-Entry Mint)",
            note=f"Demo Balance Top-Up (+ ₹{amount_rupees:,.2f})",
            idempotency_key=f"topup-{user_account.id}-{now.timestamp()}-{uuid.uuid4().hex[:6]}",
        )
        self.db.add(tx)
        self.db.flush()

        # Double-entry ledger: DEBIT mint, CREDIT user
        mint_account.balance_paise -= amount_paise
        debit_entry = LedgerEntry(
            transaction_id=tx.id,
            account_id=mint_account.id,
            entry_type=EntryType.DEBIT.value,
            amount_paise=amount_paise,
            balance_after_paise=mint_account.balance_paise,
        )

        user_account.balance_paise += amount_paise
        credit_entry = LedgerEntry(
            transaction_id=tx.id,
            account_id=user_account.id,
            entry_type=EntryType.CREDIT.value,
            amount_paise=amount_paise,
            balance_after_paise=user_account.balance_paise,
        )

        self.db.add(debit_entry)
        self.db.add(credit_entry)

        if user_account.user_id:
            audit = AuditLog(
                actor_id=user_account.user_id,
                actor_role="user",
                action="DEMO_WALLET_TOPUP",
                target_type="transaction",
                target_id=tx.id,
                details_json=f'{{"topup_rupees": {amount_rupees}, "transaction_ref": "{ref}"}}'
            )
            self.db.add(audit)
            notif = Notification(
                user_id=user_account.user_id,
                title="Demo Balance Added",
                message=f"₹{amount_rupees:,.2f} demo balance credited from Reserve Vault. Ref: {ref}",
                type="PAYMENT",
                metadata_json=f'{{"transaction_ref": "{ref}", "amount_rupees": {amount_rupees}}}'
            )
            self.db.add(notif)

        self.db.flush()
        return tx, debit_entry, credit_entry

    def execute_transfer(
        self,
        transaction: Transaction,
        sender_account: Account,
        recipient_account: Account,
    ) -> Tuple[LedgerEntry, LedgerEntry]:
        """
        Executes an atomic transfer between two accounts:
        1. Verifies sender has sufficient balance
        2. Debits sender account
        3. Credits recipient account
        4. Writes two balanced ledger entries
        5. Balances equation: sum(debit) == sum(credit)
        """
        amount_paise = transaction.amount_paise

        if amount_paise <= 0:
            raise LedgerError("Transfer amount must be strictly positive.")

        # Re-fetch sender balance within transaction
        if sender_account.balance_paise < amount_paise:
            raise InsufficientBalanceError(
                f"Insufficient funds: available ₹{sender_account.balance_paise/100:.2f}, required ₹{amount_paise/100:.2f}"
            )

        # Debit Sender
        sender_account.balance_paise -= amount_paise
        debit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=sender_account.id,
            entry_type=EntryType.DEBIT.value,
            amount_paise=amount_paise,
            balance_after_paise=sender_account.balance_paise,
        )

        # Credit Recipient
        recipient_account.balance_paise += amount_paise
        credit_entry = LedgerEntry(
            transaction_id=transaction.id,
            account_id=recipient_account.id,
            entry_type=EntryType.CREDIT.value,
            amount_paise=amount_paise,
            balance_after_paise=recipient_account.balance_paise,
        )

        self.db.add(debit_entry)
        self.db.add(credit_entry)
        self.db.flush()

        logger.info(
            "Ledger executed for TX %s: Debited %s (-%d paise), Credited %s (+%d paise)",
            transaction.transaction_ref,
            sender_account.upi_id,
            amount_paise,
            recipient_account.upi_id,
            amount_paise,
        )

        return debit_entry, credit_entry
