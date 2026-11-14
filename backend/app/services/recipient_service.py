"""
Recipient Verification & Reputation Service
Inspects simulated recipient UPI accounts for known fraud signals, community reports,
and historical trustworthiness.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.recipient import Recipient, RecipientReport
from app.models.account import Account

def get_bank_for_upi(upi_id: str) -> str:
    clean = (upi_id or "").strip().lower()
    if "@okhdfcbank" in clean or "hdfc" in clean:
        return "HDFC Bank"
    elif "@okaxis" in clean or "axis" in clean:
        return "Axis Bank"
    elif "@okicici" in clean or "icici" in clean:
        return "ICICI Bank"
    elif "@oksbi" in clean or "sbi" in clean:
        return "State Bank of India"
    elif "@raksha" in clean:
        return "Raksha Vault & Partner Bank"
    elif "@paytm" in clean:
        return "Paytm Payments Bank"
    elif "@kotak" in clean:
        return "Kotak Mahindra Bank"
    elif "@pnb" in clean:
        return "Punjab National Bank"
    elif "@barodampay" in clean or "bob" in clean:
        return "Bank of Baroda"
    elif "@fakeupi" in clean or "@giftupi" in clean or "@urgentpay" in clean:
        return "Virtual PSP (Flagged Gateway)"
    return "Simulated Partner Bank (UPI Network)"

class RecipientService:
    def __init__(self, db: Session):
        self.db = db

    def check_recipient_risk(self, upi_id: str) -> Dict[str, Any]:
        """
        Inspects recipient profile and returns reputation telemetry:
        - Simulated account age
        - Risk level
        - Report count
        - Verification status
        - Bank name
        - Registration status
        - Risk explanation
        """
        clean_upi = (upi_id or "").strip().lower()

        # Check in recipients directory
        recipient = self.db.query(Recipient).filter(
            func.lower(func.trim(Recipient.upi_id)) == clean_upi
        ).first()

        # Ensure debabratadas7557@okhdfcbank is recognized as a registered demo recipient
        if not recipient and clean_upi == "debabratadas7557@okhdfcbank":
            import json
            recipient = Recipient(
                upi_id="debabratadas7557@okhdfcbank",
                name="Debabrata Das",
                account_age_days=240,
                risk_level="LOW",
                report_count=0,
                verification_status="SIMULATED_VERIFIED",
                risk_indicators=json.dumps(["Verified Bank Contact", "KYC Completed"]),
            )
            self.db.add(recipient)
            self.db.flush()

        reports_count = self.db.query(func.count(RecipientReport.id)).filter(
            func.lower(func.trim(RecipientReport.upi_id)) == clean_upi
        ).scalar() or 0

        # Check if recipient is a registered user account
        account = self.db.query(Account).filter(
            func.lower(func.trim(Account.upi_id)) == clean_upi
        ).first()

        bank_name = get_bank_for_upi(clean_upi)
        name = "Unknown Recipient"
        account_age_days = 15
        risk_level = "LOW"
        verification_status = "UNVERIFIED"
        indicators = []
        is_registered = False

        if recipient:
            is_registered = True
            name = recipient.name
            account_age_days = recipient.account_age_days
            risk_level = recipient.risk_level
            verification_status = recipient.verification_status
            if recipient.risk_indicators:
                import json
                try:
                    indicators = json.loads(recipient.risk_indicators)
                except Exception:
                    indicators = [recipient.risk_indicators]
        elif account and account.user:
            is_registered = True
            name = account.user.full_name
            account_age_days = 90
            risk_level = "LOW"
            verification_status = "SIMULATED_VERIFIED"
            indicators = ["Internal RakshaPay Registered User"]
        else:
            is_registered = False
            indicators = ["Unrecognized UPI ID in local simulation directory"]
            risk_level = "HIGH"
            verification_status = "UNVERIFIED"

        # Factor in reports
        total_reports = max(reports_count, recipient.report_count if recipient else 0)
        if total_reports > 0:
            risk_level = "HIGH"
            indicators.append(f"Flagged by {total_reports} user security report(s)")

        # Generate explanation
        if not is_registered:
            explanation = (
                f"Recipient UPI ID '{clean_upi}' does not exist in the simulated RakshaPay directory."
            )
        elif risk_level == "HIGH":
            explanation = (
                f"Caution: Recipient {clean_upi} has {total_reports} security report(s) on file "
                "or elevated risk flags. We recommend pausing and verifying before sending funds."
            )
        elif risk_level == "MEDIUM":
            explanation = (
                f"Recipient {clean_upi} is unverified or newly seen in the simulation network. "
                "Ensure you personally know the person or business before transferring."
            )
        else:
            explanation = (
                f"Recipient {clean_upi} has an active simulated history with no unresolved fraud reports on file."
            )

        return {
            "upi_id": clean_upi,
            "name": name,
            "bank_name": bank_name,
            "is_registered": is_registered,
            "account_age_days": account_age_days,
            "risk_level": risk_level,
            "report_count": total_reports,
            "verification_status": verification_status,
            "risk_indicators": indicators,
            "is_simulated": True,
            "explanation": explanation,
        }

    def report_recipient(self, reporter_user_id: str, upi_id: str, reason: str, details: Optional[str] = None) -> RecipientReport:
        clean_upi = upi_id.strip().lower()
        report = RecipientReport(
            upi_id=clean_upi,
            reporter_user_id=reporter_user_id,
            reason=reason,
            details=details,
            status="PENDING",
        )
        self.db.add(report)

        # Update recipient record report count if exists
        recipient = self.db.query(Recipient).filter(Recipient.upi_id == clean_upi).first()
        if recipient:
            recipient.report_count += 1
            recipient.risk_level = "HIGH"
        else:
            # Create flagged recipient entry
            recipient = Recipient(
                upi_id=clean_upi,
                name="Reported Entity",
                account_age_days=1,
                risk_level="HIGH",
                report_count=1,
                verification_status="FLAGGED_SUSPICIOUS",
                risk_indicators='["Reported by user for fraud/impersonation"]',
            )
            self.db.add(recipient)

        self.db.commit()
        self.db.refresh(report)
        return report
