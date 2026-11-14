"""
ML Training Pipeline: Random Forest Fraud Classifier
Trains and serializes the baseline fraud detection model on synthetic transaction data.
"""
import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from ml.dataset.generate_dataset import generate_synthetic_transactions
from ml.preprocessing import FEATURE_COLUMNS, preprocess_dataframe

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

def train_fraud_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "synthetic_transactions.csv")
    
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
    else:
        df = generate_synthetic_transactions(10000)
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        df.to_csv(dataset_path, index=False)
        
    X = preprocess_dataframe(df)
    y = df["is_fraud"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate on held-out test split
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_proba)),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }
    
    # Feature importances
    importances = {
        col: float(imp)
        for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_)
    }
    
    metadata = {
        "model_version": "1.0.0-rf-baseline",
        "algorithm": "RandomForestClassifier",
        "features": FEATURE_COLUMNS,
        "metrics": metrics,
        "feature_importances": importances,
    }
    
    # Save model and metadata
    joblib.dump(model, MODEL_PATH)
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Model successfully saved to {MODEL_PATH}")
    print("Evaluation Metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")
    print("\nFeature Importances:")
    for col, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  {col}: {imp:.4f}")
        
    return metadata

if __name__ == "__main__":
    train_fraud_model()
