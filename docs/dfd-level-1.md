# Data Flow Diagram (DFD) — Level 1
## Subsystem Decomposition

The Level 1 diagram decomposes RakshaPay into its five primary operational subsystems and their interactions with system datastores.

```mermaid
flowchart TD
    Customer([Customer])
    Admin([SOC Admin])
    Gemini([Google Gemini])

    subgraph Processes
        P1[1.0 Authentication & Identity Verification]
        P2[2.0 Payment Processing & Idempotency Gateway]
        P3[3.0 Hybrid Fraud & Risk Engine]
        P4[4.0 Double-Entry Accounting Ledger]
        P5[5.0 Gemini AI Cyber Defense Service]
        P6[6.0 SOC Operations & Case Management]
    end

    subgraph Data Stores
        D1[(Users & Accounts DB)]
        D2[(Transactions & Idempotency DB)]
        D3[(Double-Entry Ledger DB)]
        D4[(Fraud Alerts & Notes DB)]
        D5[(Recipients Directory & Reports DB)]
        D6[(Audit Logs DB)]
    end

    %% Customer flows
    Customer -->|Phone & OTP| P1
    P1 <-->|Read / Write Profile| D1
    P1 -->|JWT Token| Customer

    Customer -->|Initiate Payment| P2
    P2 <-->|Check Idempotency| D2
    P2 <-->|Validate Balance in Paise| D1
    P2 -->|Dispatch Features| P3

    P3 <-->|Query Recipient Reputation| D5
    P3 <-->|Query Velocity & History| D2
    P3 -->|Risk Verdict 0-100| P2

    P2 -->|If Approved: Transfer| P4
    P4 <-->|Atomic Debit & Credit| D1
    P4 -->|Write Balanced Entries| D3

    P2 -->|If Blocked/Pending: Alert| P6
    P6 -->|Write Alert| D4

    P2 -->|Explain Block| P5
    P5 <-->|Analyze Threat| Gemini
    P5 -->|AI Explanation| Customer
    P2 -->|Transaction Receipt| Customer

    Customer -->|Scam Message / Chat| P5

    %% Admin flows
    Admin -->|Credentials| P1
    Admin -->|Review Alerts & Add Notes| P6
    P6 <-->|Read / Update Alerts| D4
    P6 -->|Soft-Suspend User| D1
    P6 -->|Append Action| D6
    P6 -->|Live KPIs| Admin
```
