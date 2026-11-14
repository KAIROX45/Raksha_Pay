# RakshaPay — RESTful API Documentation
## OpenAPI Specification Reference

Base URL: `http://localhost:8000/api`  
Interactive Swagger UI: `http://localhost:8000/api/docs`  
ReDoc UI: `http://localhost:8000/api/redoc`  

---

## 1. Authentication Endpoints

### `POST /api/auth/send-otp`
Dispatches an SMS OTP via Firebase Phone Auth or returns development demo parameters.

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Firebase SMS not configured in .env. Using Demo Mode verification code (123456).",
  "is_development_fallback": true,
  "dev_otp": "123456"
}
```

---

### `POST /api/auth/verify-otp`
Validates the OTP code or Firebase ID token and returns an authenticated Bearer JWT session.

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": {
    "id": "e4c9c7e0-b3e1-4509-9f69-d4198c8c502b",
    "phone": "+919876543210",
    "full_name": "Rohit Sharma [DEMO]",
    "role": "user",
    "status": "active",
    "is_demo": true
  }
}
```

---

### `POST /api/auth/admin/login`
Authenticates a provisioned SOC analyst account.

**Request:**
```json
{
  "phone": "+919999900000",
  "password": "Admin@Raksha2026"
}
```

---

## 2. Simulated Payment Endpoints

### `POST /api/transactions/initiate`
Executes the full 11-step payment lifecycle: idempotency verification, balance checking, fraud telemetry evaluation, decision enforcement, and atomic double-entry ledger settlement.

**Headers:**
`Authorization: Bearer <token>`

**Request:**
```json
{
  "recipient_upi_id": "aman@raksha",
  "amount_rupees": 500.0,
  "idempotency_key": "idemp-custom-key-998822",
  "note": "Lunch split"
}
```

**Response (200 OK - Approved):**
```json
{
  "id": "76e33f38-2a1c-43f1-b4f0-469b828efb05",
  "transaction_ref": "RAKSHA-20261114-A7F2D84C",
  "sender_account_id": "...",
  "sender_upi_id": "rohit@raksha",
  "sender_name": "Rohit Sharma [DEMO]",
  "recipient_upi_id": "aman@raksha",
  "recipient_name": "Aman Gupta",
  "amount_paise": 50000,
  "amount_rupees": 500.0,
  "status": "APPROVED",
  "risk_score": 14,
  "risk_category": "LOW",
  "decision_reason": "Transaction parameters are consistent with legitimate spending patterns.",
  "risk_signals": [],
  "idempotency_key": "idemp-custom-key-998822",
  "ledger_verified": true,
  "is_simulated": true
}
```

**Response (200 OK - Blocked High-Risk Transaction):**
```json
{
  "id": "...",
  "transaction_ref": "RAKSHA-20261114-88A9C102",
  "status": "BLOCKED",
  "risk_score": 88,
  "risk_category": "HIGH",
  "decision_reason": "High-risk transaction automatically blocked by fraud engine (Risk score: 88/100).",
  "risk_signals": [
    "Recipient UPI ID is flagged with active fraud reports or high risk reputation",
    "Elevated amount (₹35,000.00)"
  ],
  "ai_explanation": "This simulated payment was blocked because recipient has 4 active community reports for remote screen sharing fraud.",
  "ledger_verified": false,
  "is_simulated": true
}
```

---

### `GET /api/transactions`
Retrieves transactions for the authenticated user with optional `status` (`ALL`, `APPROVED`, `PENDING`, `BLOCKED`) and `search` query parameters.

---

### `GET /api/transactions/{transaction_id}/receipt`
Returns verified transaction receipt details formatted for digital display or text download.

---

## 3. Recipient Risk Verification

### `GET /api/recipients/{upi_id}/risk`
Pre-inspects recipient handle reputation, simulated account age, past community scam reports, and known indicators.

**Response (200 OK):**
```json
{
  "upi_id": "techsupport@fakeupi",
  "name": "Global Tech Support Impersonator",
  "account_age_days": 3,
  "risk_level": "HIGH",
  "report_count": 4,
  "verification_status": "FLAGGED_SUSPICIOUS",
  "risk_indicators": [
    "Reported for AnyDesk remote screen share scam",
    "New account created 3 days ago"
  ],
  "explanation": "Caution: Recipient has 4 security report(s) on file. We recommend pausing and verifying before sending funds."
}
```

### `POST /api/recipients/report`
Allows users to report suspicious UPI IDs to the SOC fraud team.

---

## 4. Google Gemini AI Endpoints

### `POST /api/ai/explain-fraud`
Requests a natural language breakdown of verified telemetry risk signals from Google Gemini.

### `POST /api/ai/analyze-scam`
Inspects untrusted text for phishing keywords, artificial urgency, and impersonation schemes.

**Request:**
```json
{
  "message_text": "URGENT: Your power will be disconnected at 9:30 PM. Call officer at 9876543210 and pay via UPI to avoid disconnection."
}
```

**Response (200 OK):**
```json
{
  "risk_assessment": "HIGH_RISK",
  "risk_score": 92,
  "suspicious_phrases": [
    "URGENT",
    "ELECTRICITY DISCONNECT",
    "CALL OFFICER"
  ],
  "explanation": "High-risk intimidation scam employing artificial time pressure to induce panic.",
  "safety_recommendations": [
    "Never pay utility bills using personal phone numbers in SMS.",
    "Verify bill status directly through your state power distribution portal."
  ],
  "model_used": "gemini-2.5-flash"
}
```

### `POST /api/ai/chat`
Conversational security assistant tailored to authenticated user context.

---

## 5. Admin & SOC Operations Endpoints

- `GET /api/admin/overview`: System-wide KPI counters calculated from live database records.
- `GET /api/admin/transactions`: Comprehensive transaction search and filter workspace.
- `GET /api/admin/fraud-alerts`: Fraud incident tracking with severity filters.
- `POST /api/admin/investigations/{alert_id}/notes`: Appends forensic analyst notes and updates case status.
- `GET /api/admin/users`: Customer directory with active balances.
- `PATCH /api/admin/users/{user_id}/status`: Soft-suspends or reactivates customer account.
- `GET /api/admin/audit-logs`: Immutable audit trail of all security and financial actions.
