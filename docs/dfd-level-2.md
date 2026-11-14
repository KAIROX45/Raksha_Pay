# Data Flow Diagram (DFD) — Level 2
## Detailed Payment Validation, Fraud Scoring & Settlement Process

The Level 2 diagram explodes process **2.0 (Payment Processing)** and **3.0 (Fraud Detection)** into their individual atomic micro-steps.

```mermaid
flowchart TD
    Req[Payment Request: Recipient, Amount, IdempotencyKey] --> S1[2.1 Idempotency Key Validation]
    
    S1 -->|Duplicate Key Found| S1_Cached[Return Cached Transaction Response]
    S1 -->|New Key| S2[2.2 Sender Account Verification]
    
    S2 --> S3[2.3 Recipient Directory Verification]
    S3 --> S4[2.4 Balance Sufficiency Check in Paise]
    
    S4 -->|Insufficient Balance| Err1[Reject with 400 Insufficient Funds]
    S4 -->|Sufficient Balance| S5[3.1 Telemetry Feature Extraction]
    
    subgraph Fraud Pipeline
        S5 -->|Features Vector| S6[3.2 Rule-Based Scrutiny Engine]
        S5 -->|Features Vector| S7[3.3 Random Forest Classifier]
        
        S6 -->|Rule Score 0-100 & Signals| S8[3.4 Score Fusion & Boundary Logic]
        S7 -->|ML Probability 0-100| S8
    end

    S8 -->|Score < 30| Decision_Approve[Decision: APPROVED]
    S8 -->|Score 30-69| Decision_Pending[Decision: PENDING]
    S8 -->|Score >= 70| Decision_Block[Decision: BLOCKED]

    subgraph Settlement
        Decision_Approve --> S9[4.1 Debit Sender Account]
        S9 --> S10[4.2 Credit Recipient Account]
        S10 --> S11[4.3 Insert Two Balanced Ledger Entries]
    end

    Decision_Pending --> P1[Log PENDING State - Move Zero Funds]
    P1 --> P2[Create Medium Severity Fraud Alert]

    Decision_Block --> B1[Log BLOCKED State - Move Zero Funds]
    B1 --> B2[Create High/Critical Fraud Alert]
    B2 --> B3[Request Gemini AI Explanation]

    S11 --> Commit[Atomic Database Commit]
    P2 --> Commit
    B3 --> Commit

    Commit --> Audit[Create Immutable Audit Log]
    Audit --> Out[Return JSON Transaction Receipt to Client]
```
