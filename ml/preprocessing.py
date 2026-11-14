"""
ML Preprocessing & Feature Transformation Pipeline
Prepares raw transaction features for Scikit-Learn training and inference.
"""
from typing import Dict, Any, List
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "amount",
    "tx_frequency_1h",
    "recipient_familiarity",
    "failed_attempts_24h",
    "recipient_risk_flag",
    "hour_of_day",
    "is_late_night",
    "historical_deviation",
]

def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and clean transaction feature dataframe."""
    clean_df = df.copy()
    for col in FEATURE_COLUMNS:
        if col not in clean_df.columns:
            clean_df[col] = 0.0
    return clean_df[FEATURE_COLUMNS]

def extract_features_from_dict(raw: Dict[str, Any]) -> pd.DataFrame:
    """Converts a single transaction dictionary into a pandas DataFrame matching trained feature names."""
    row = {
        "amount": float(raw.get("amount", 0.0)),
        "tx_frequency_1h": float(raw.get("tx_frequency_1h", 0)),
        "recipient_familiarity": float(raw.get("recipient_familiarity", 1)),
        "failed_attempts_24h": float(raw.get("failed_attempts_24h", 0)),
        "recipient_risk_flag": float(raw.get("recipient_risk_flag", 0)),
        "hour_of_day": float(raw.get("hour_of_day", 12)),
        "is_late_night": float(raw.get("is_late_night", 0)),
        "historical_deviation": float(raw.get("historical_deviation", 1.0)),
    }
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
