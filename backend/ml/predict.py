"""
ML Model Inference Service
Loads trained Random Forest model and predicts fraud probability (0 to 100).
"""
import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
import joblib

from backend.ml.preprocessing import extract_features_from_dict

logger = logging.getLogger("rakshapay.ml")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "fraud_model.joblib")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "models", "model_metadata.json")

_model = None
_metadata = None

def load_model():
    global _model, _metadata
    if _model is not None:
        return _model, _metadata
    
    if os.path.exists(MODEL_PATH) and os.path.exists(METADATA_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
            if hasattr(_model, "n_jobs"):
                _model.n_jobs = 1
            with open(METADATA_PATH, "r") as f:
                _metadata = json.load(f)
            logger.info("ML Fraud Model loaded successfully: %s", _metadata.get("model_version"))
        except Exception as e:
            logger.error("Failed to load ML model: %s", e)
            _model = None
            _metadata = None
    else:
        logger.warning("ML model artifact not found at %s. Rule engine fallback will be used.", MODEL_PATH)
        _model = None
        _metadata = None
        
    return _model, _metadata

def predict_fraud_score(feature_dict: Dict[str, Any]) -> Tuple[Optional[int], Optional[str], Optional[Dict[str, float]]]:
    """
    Predict continuous fraud score from 0 to 100.
    Returns (ml_score_int, model_version_str, feature_importances_dict).
    If model is unavailable, returns (None, None, None).
    """
    model, metadata = load_model()
    if model is None:
        return None, "ML-UNAVAILABLE-RULE-ONLY", None
    
    try:
        X = extract_features_from_dict(feature_dict)
        # Class 1 is Fraud
        prob = float(model.predict_proba(X)[0][1])
        score = int(round(prob * 100.0))
        version = metadata.get("model_version", "1.0.0") if metadata else "1.0.0"
        importances = metadata.get("feature_importances", {}) if metadata else {}
        return score, version, importances
    except Exception as e:
        logger.error("Error running ML prediction: %s", e)
        return None, "ML-ERROR-FALLBACK", None
