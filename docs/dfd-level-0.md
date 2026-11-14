# Data Flow Diagram (DFD) — Level 0 (Context Diagram)
## RakshaPay Platform Context

The Level 0 context diagram represents the boundaries of the RakshaPay system, external entities interacting with the application, and the primary data streams.

```mermaid
flowchart TD
    Customer([Customer / Sender]) -->|1. Phone / OTP Credentials| System[RakshaPay Security Platform]
    Customer -->|2. Payment Request upi_id, amount, note| System
    Customer -->|3. Untrusted Scam Message Text| System
    Customer -->|4. Security Inquiries| System

    System -->|5. OTP / Authenticated Session JWT| Customer
    System -->|6. Payment Result & Verified Receipt| Customer
    System -->|7. Gemini Scam Breakdown & Safety Tips| Customer
    System -->|8. AI Security Assistant Guidance| Customer

    Admin([SOC Fraud Analyst]) -->|9. Admin Login Credentials| System
    Admin -->|10. Case Notes & User Suspension Flags| System

    System -->|11. Real-Time Telemetry & Alert Feeds| Admin
    System -->|12. Immutable Audit Logs| Admin

    System <-->|13. Content Generation & Chat Prompts| GeminiAPI([Google Gemini GenAI Service])
```

### External Entities:
1. **Customer / Sender**: Initiates simulated payments, inspects recipient risk, pastes scam messages, and queries security assistant.
2. **SOC Fraud Analyst**: Reviews flagged fraud alerts, investigates suspicious transactions, soft-suspends anomalous accounts, and records findings.
3. **Google Gemini GenAI Service**: Analyzes untrusted text for phishing patterns and explains risk vectors in plain English.
