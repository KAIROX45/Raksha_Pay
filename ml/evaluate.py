"""
Model Evaluation and Metric Verification Script
"""
import os
import json

def get_model_evaluation_report():
    metadata_path = os.path.join(os.path.dirname(__file__), "models", "model_metadata.json")
    if not os.path.exists(metadata_path):
        return {
            "status": "UNAVAILABLE",
            "message": "Model not yet trained. Run ml/train.py first."
        }
    with open(metadata_path, "r") as f:
        return json.load(f)

if __name__ == "__main__":
    report = get_model_evaluation_report()
    print(json.dumps(report, indent=2))
