"""
Synthetic Mobile-Money & UPI Transaction Dataset Generator
Inspired by the PaySim synthetic financial dataset research.
Generates realistic simulated UPI transaction feature vectors with legitimate and fraudulent patterns.
"""
import os
import numpy as np
import pandas as pd

def generate_synthetic_transactions(n_samples: int = 10000, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    
    # 1. Transaction Amount (Log-normal distribution resembling real payment amounts in INR)
    # Most payments are ₹100 - ₹5,000; high-value are ₹10,000 - ₹100,000+
    amounts = np.random.lognormal(mean=7.5, sigma=1.4, size=n_samples)
    amounts = np.clip(amounts, 10.0, 200000.0)
    
    # 2. Transaction Frequency (transactions by this user in last 1 hour: 0 to 10)
    tx_frequency_1h = np.random.poisson(lam=0.8, size=n_samples)
    
    # 3. Recipient Familiarity (0 = completely new recipient, 1 = familiar recipient)
    recipient_familiarity = np.random.choice([0, 1], size=n_samples, p=[0.35, 0.65])
    
    # 4. Failed Attempts in last 24h (0 to 6)
    failed_attempts_24h = np.random.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.75, 0.15, 0.06, 0.03, 0.01])
    
    # 5. Recipient Risk Indicator (0 = clean, 1 = flagged/reported recipient)
    recipient_risk_flag = np.random.choice([0, 1], size=n_samples, p=[0.92, 0.08])
    
    # 6. Hour of Day (0 to 23)
    hour_probs = np.array([
        0.01, 0.01, 0.01, 0.01, 0.01, 0.02, # 00-05 late night
        0.03, 0.05, 0.07, 0.07, 0.06, 0.06, # 06-11 morning
        0.07, 0.07, 0.06, 0.06, 0.06, 0.06, # 12-17 afternoon
        0.06, 0.07, 0.07, 0.04, 0.02, 0.01  # 18-23 evening
    ], dtype=np.float64)
    hour_probs = hour_probs / hour_probs.sum()
    hours = np.random.choice(range(24), size=n_samples, p=hour_probs)
    is_late_night = np.isin(hours, [0, 1, 2, 3, 4, 5]).astype(int)
    
    # 7. Deviation from historical average spending (ratio: current / avg_spend)
    # 1.0 = normal, > 3.0 = sudden spike
    historical_deviation = np.random.lognormal(mean=0.1, sigma=0.6, size=n_samples)
    
    # Synthesize fraud probability based on risk signals
    # Fraud indicators: high amount, new recipient, high velocity, late night, reported recipient, high deviation
    fraud_logits = (
        -4.2
        + 0.00004 * amounts
        + 0.55 * tx_frequency_1h
        - 0.90 * recipient_familiarity
        + 0.80 * failed_attempts_24h
        + 2.10 * recipient_risk_flag
        + 0.70 * is_late_night
        + 0.45 * historical_deviation
    )
    
    fraud_probs = 1.0 / (1.0 + np.exp(-fraud_logits))
    # Generate binary label: 1 = Fraud, 0 = Legitimate
    is_fraud = (np.random.binomial(1, fraud_probs) == 1).astype(int)
    
    df = pd.DataFrame({
        "amount": amounts.round(2),
        "tx_frequency_1h": tx_frequency_1h,
        "recipient_familiarity": recipient_familiarity,
        "failed_attempts_24h": failed_attempts_24h,
        "recipient_risk_flag": recipient_risk_flag,
        "hour_of_day": hours,
        "is_late_night": is_late_night,
        "historical_deviation": historical_deviation.round(2),
        "is_fraud": is_fraud,
    })
    
    return df

if __name__ == "__main__":
    os.makedirs("ml/dataset", exist_ok=True)
    df = generate_synthetic_transactions(10000)
    out_path = os.path.join("ml", "dataset", "synthetic_transactions.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} synthetic records. Fraud rate: {df['is_fraud'].mean():.2%}")
    print(f"Saved to {out_path}")
