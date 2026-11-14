"""
Hybrid Fraud Engine: Rule-Based Logic + ML Classifier Integration
Combines 7 configurable risk rules with Random Forest inference to produce authoritative decisions.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.logging import logger
from app.models.transaction import Transaction, TransactionStatus
from app.models.recipient import Recipient, RecipientReport
from ml.predict import predict_fraud_score

class FraudEngine:
    def __init__(self, db: Session):
        self.db = db

    def extract_user_telemetry(self, user_account_id: str, recipient_upi_id: str, amount_rupees: float) -> Dict[str, Any]:
        """Extract historical and velocity features for the given sender and recipient."""
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        twenty_four_hours_ago = now - timedelta(hours=24)

        # 1. Transaction frequency in last 1 hour
        recent_tx_count = self.db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.created_at >= one_hour_ago,
        ).scalar() or 0

        # 2. Recipient familiarity: has the user successfully sent money to this recipient before?
        prior_successful_tx = self.db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.recipient_upi_id == recipient_upi_id,
            Transaction.status == TransactionStatus.APPROVED.value,
        ).scalar() or 0
        is_familiar = 1 if prior_successful_tx > 0 else 0

        # 3. Failed or blocked attempts in last 24h
        failed_count_24h = self.db.query(func.count(Transaction.id)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.created_at >= twenty_four_hours_ago,
            Transaction.status.in_([TransactionStatus.FAILED.value, TransactionStatus.BLOCKED.value]),
        ).scalar() or 0

        # 4. Recipient risk indicators
        clean_rec_upi = (recipient_upi_id or "").strip().lower()
        recipient_record = self.db.query(Recipient).filter(
            func.lower(func.trim(Recipient.upi_id)) == clean_rec_upi
        ).first()
        recipient_reports_count = self.db.query(func.count(RecipientReport.id)).filter(
            func.lower(func.trim(RecipientReport.upi_id)) == clean_rec_upi
        ).scalar() or 0

        recipient_risk_flag = 0
        if recipient_record and (recipient_record.risk_level == "HIGH" or recipient_record.report_count > 0):
            recipient_risk_flag = 1
        elif recipient_reports_count > 0:
            recipient_risk_flag = 1

        # 5. Timing
        current_hour = now.hour
        is_late_night = 1 if current_hour in [0, 1, 2, 3, 4, 5] else 0

        # 6. Historical spending average for deviation calculation
        avg_amount_paise = self.db.query(func.avg(Transaction.amount_paise)).filter(
            Transaction.sender_account_id == user_account_id,
            Transaction.status == TransactionStatus.APPROVED.value,
        ).scalar()

        if avg_amount_paise and avg_amount_paise > 0:
            avg_rupees = float(avg_amount_paise) / 100.0
            historical_deviation = round(amount_rupees / max(avg_rupees, 100.0), 2)
        else:
            historical_deviation = 1.0

        return {
            "amount": amount_rupees,
            "tx_frequency_1h": recent_tx_count,
            "recipient_familiarity": is_familiar,
            "failed_attempts_24h": failed_count_24h,
            "recipient_risk_flag": recipient_risk_flag,
            "hour_of_day": current_hour,
            "is_late_night": is_late_night,
            "historical_deviation": historical_deviation,
            "recipient_reports_count": recipient_reports_count,
        }

    def evaluate_rules(self, features: Dict[str, Any]) -> Tuple[int, List[str]]:
        """
        Evaluate 7 deterministic rules and compute rule penalty points (0 to 100).
        """
        signals = []
        rule_points = 0

        # Rule 1: High Transaction Amount
        amount = features.get("amount", 0.0)
        if amount >= settings.HIGH_VALUE_THRESHOLD_RUPEES:
            signals.append(f"High-value payment (₹{amount:,.2f} exceeds ₹{settings.HIGH_VALUE_THRESHOLD_RUPEES:,.2f} threshold)")
            rule_points += 35
        elif amount >= 25000:
            signals.append(f"Elevated amount (₹{amount:,.2f})")
            rule_points += 15

        # Rule 2: Rapid velocity
        freq_1h = features.get("tx_frequency_1h", 0)
        if freq_1h >= settings.VELOCITY_MAX_TX_COUNT:
            signals.append(f"Rapid transaction velocity ({freq_1h} payments attempted in past 60 minutes)")
            rule_points += 30

        # Rule 3: First-time recipient
        if features.get("recipient_familiarity", 0) == 0:
            signals.append("First-time recipient (no historical transactions on record)")
            rule_points += 15

        # Rule 4: Repeated recent failures
        failed_count = features.get("failed_attempts_24h", 0)
        if failed_count >= 2:
            signals.append(f"Account has {failed_count} recent failed or blocked attempts in last 24h")
            rule_points += 20

        # Rule 5: Reported or suspicious recipient
        if features.get("recipient_risk_flag", 0) == 1 or features.get("recipient_reports_count", 0) > 0:
            signals.append("Recipient UPI ID is flagged with active fraud reports or high risk reputation")
            rule_points += 45

        # Rule 6: Unusual transaction timing (late night)
        if features.get("is_late_night", 0) == 1:
            signals.append(f"Unusual transaction timing (initiated at {features.get('hour_of_day')}:00 hrs late night)")
            rule_points += 15

        # Rule 7: Sudden spending deviation
        deviation = features.get("historical_deviation", 1.0)
        if deviation >= 4.0:
            signals.append(f"Significant spending spike ({deviation:.1f}x higher than your historical average)")
            rule_points += 25

        rule_score = min(rule_points, 100)
        return rule_score, signals

    def analyze_transaction(
        self,
        sender_account_id: str,
        recipient_upi_id: str,
        amount_rupees: float,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes hybrid fraud detection:
        1. Extract features
        2. Evaluate rules
        3. Evaluate ML model
        4. Fuse score and assign risk category
        """
        features = self.extract_user_telemetry(sender_account_id, recipient_upi_id, amount_rupees)
        rule_score, signals = self.evaluate_rules(features)
        ml_score, model_version, feature_importances = predict_fraud_score(features)

        # Score fusion
        if ml_score is not None:
            # Weighted average: 40% rule points, 60% ML classifier
            final_score = int(round(0.4 * rule_score + 0.6 * ml_score))
            # If critical rule fired (e.g. flagged recipient or severe velocity), ensure floor
            if features.get("recipient_risk_flag", 0) == 1:
                final_score = max(final_score, 75)
        else:
            final_score = rule_score
            signals.append("Notice: Machine Learning service in fallback mode; evaluated using core rule engine.")

        final_score = max(0, min(100, final_score))

        # Risk Decision Thresholds
        if final_score < settings.FRAUD_LOW_THRESHOLD:
            risk_category = "LOW"
            recommended_action = "APPROVE"
            decision_reason = "Transaction parameters are consistent with legitimate spending patterns."
        elif final_score < settings.FRAUD_HIGH_THRESHOLD:
            risk_category = "MEDIUM"
            recommended_action = "VERIFY"
            decision_reason = f"Transaction held for secondary verification due to risk signals (Risk score: {final_score}/100)."
        else:
            risk_category = "HIGH"
            recommended_action = "BLOCK"
            decision_reason = f"High-risk transaction automatically blocked by fraud engine (Risk score: {final_score}/100)."

        return {
            "risk_score": final_score,
            "risk_category": risk_category,
            "recommended_action": recommended_action,
            "detection_signals": signals,
            "rule_score": rule_score,
            "ml_score": ml_score,
            "model_version": model_version or "rule-fallback",
            "feature_importance": feature_importances,
            "decision_reason": decision_reason,
            "telemetry_features": features,
        }
