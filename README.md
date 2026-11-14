# RakshaPay — AI-Powered Smart Payment Security & Fraud Prevention Platform

> **Pay Smart. Stay Protected.**  
> *Category*: Financial Technology, Digital Payments, Machine Learning & Cyber Safety  
> *Target Submission*: Enterprise & National-Level Fintech Hackathon

---

## 1. Project Overview

**RakshaPay** is an AI-powered, simulated UPI payment security platform that combines deterministic rule-based fraud detection, scikit-learn machine learning, and Google Gemini to analyze simulated payment transactions, identify suspicious activity, assess recipient risk, and help users make safer financial decisions.

The platform provides two distinctly branded, purpose-built portals:
1. **User Portal**: Mobile-first dark fintech consumer wallet with simulated UPI transfers, recipient safety inspections, and AI scam message analyzers.
2. **SOC Admin Portal**: Financial Security Operations Center (SOC) with real-time database telemetry, transaction monitors, alert investigation workspaces, soft-suspension controls, and append-only audit trails.

> [!IMPORTANT]
> **SIMULATED UPI NETWORK DISCLAIMER**  
> RakshaPay is a financial technology research and cyber safety demonstration platform. It does **not** process real Indian Rupee currency or connect to live NPCI or bank UPI networks. All accounts, balances, and ledger entries are simulated for security education.

---

## 2. Design System & Reference Aesthetic

RakshaPay strictly follows a premium dark fintech aesthetic inspired by modern mobile banking interfaces:

### Official Color Palette
```css
--background: #2C3531; /* 65% Charcoal dark surfaces */
--primary:    #116466; /* 20% Deep Teal surfaces & glowing accents */
--text:       #D1E8E2; /* 10% Soft Mint light typography */
--accent:     #FFCB9A; /*  5% Warm Peach action buttons & glowing highlights */
--secondary:  #D9B08C; /* Warm Sand auxiliary accents */
```

### Visual Highlights
- **Glassmorphism Panels**: `backdrop-blur-md` with subtle teal glowing borders (`rgba(17, 100, 102, 0.35)`).
- **Peach Action Glow**: Warm peach buttons (`#FFCB9A`) with vibrant hover transitions.
- **3D Interactive Hero**: Three.js rotating icosahedron security shield with dynamic turquoise and peach point lights (includes static SVG fallback for low-power devices).
- **5 Core Reference Experiences**: Landing Page, User Dashboard, Send Money, Payment Receipt, and Transaction History.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, React Router v6, Three.js, Lucide Icons, Recharts |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, Python-Jose (JWT), Passlib (Bcrypt) |
| **Database** | PostgreSQL / SQLite (with Write-Ahead-Logging and foreign key enforcement) |
| **Machine Learning** | Scikit-Learn (Random Forest Classifier), Pandas, NumPy, Joblib |
| **Generative AI** | Google Gemini API (Official `google-genai` Python SDK, Gemini 2.5 Flash) |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 4. Pre-Configured Demo Credentials

To facilitate rapid evaluation without manual database setup, the platform includes pre-seeded demo accounts:

### Customer Demo Accounts (User Portal)
- **Primary Customer**: `Rohit Sharma`
  - Mobile: `+919876543210`
  - Simulated UPI ID: `rohit@raksha`
  - Simulated Wallet Balance: **₹50,000.00** (5,000,000 paise)
  - Verification Code (Demo OTP): `123456`
- **Peer Contact**: `Aman Gupta`
  - Mobile: `+919876543211`
  - Simulated UPI ID: `aman@raksha`
  - Simulated Balance: **₹25,000.00**
  - Verification Code: `123456`

### SOC Fraud Analyst Account (Admin Portal)
- **Admin Lead**: `SOC Fraud Investigator`
  - Portal URL: `http://localhost:5173/admin/login`
  - Mobile: `+919999900000`
  - Password: `Admin@Raksha2026`
  - Role: `admin` (Server-side RBAC enforced)

### Simulated Recipients Directory (For Testing)
- `aman@raksha` — **Clean** peer contact (0 reports, Low Risk).
- `quickmart@upi` — **Verified** merchant grocer (Low Risk).
- `techsupport@fakeupi` — **Flagged Scammer** (4 fraud reports, High Risk: triggers automated payment block).
- `electricityboard@urgentpay` — **Impersonator** (Utility bill scam, Medium Risk: triggers pending verification).

---

## 5. Quick Start & Setup Instructions

### ⚡ One-Click Instant Launch (Windows)
Simply double-click **`start.bat`** in the project root directory!  
It automatically:
1. Verifies the virtual environment, ML model, and demo database.
2. Starts the FastAPI backend gateway on port `8000`.
3. Starts the React development server on port `5173`.
4. Automatically opens `http://localhost:5173` in your default web browser.

---

### Option A: Standard Local Setup

#### Step 1: Backend Setup
```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv venv

# Windows activate:
venv\Scripts\activate
# Linux/macOS activate:
# source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Train Random Forest Fraud Classifier
cd ..
python -m ml.train

# Seed Demo Database (Creates users, accounts, recipients, sample alerts)
python scripts/seed_demo.py

# Start FastAPI API Gateway (Runs on port 8000)
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Step 2: Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend
npm install
npm run dev
# App will open at http://localhost:5173
```

---

### Option B: One-Click Setup Script
- **Windows**: Run `scripts\setup.bat`
- **Linux / macOS**: Run `chmod +x scripts/setup.sh && ./scripts/setup.sh`

---

### Option C: Docker Compose
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/api/docs`

---

## 6. External Credential Configuration

### 1. Google Gemini API Setup (Optional for Live Explanations)
1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. In `backend/.env` (or project root `.env`), set:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. *Note*: If `GEMINI_API_KEY` is omitted, RakshaPay automatically switches to built-in deterministic heuristic cyber defense fallbacks. **No feature crashes or stops working.**

### 2. Firebase Phone SMS Authentication (Optional for Production SMS)
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication > Sign-in method > Phone**.
3. Generate a service account private key JSON.
4. In `backend/.env`, set:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json
   ```
5. *Note*: In development / hackathon demonstration mode, RakshaPay provides a clearly labeled Demo OTP mode using code `123456`, maintaining complete functional realism without faking SMS delivery.

---

## 7. 11-Step Payment & Fraud Detection Lifecycle

```
[Payment Request] 
       │
       ▼
1. Idempotency Check (Prevents duplicate debits on retries)
       │
       ▼
2. Sender Account Validation
       │
       ▼
3. Recipient Existence Check in Simulated Directory
       │
       ▼
4. Amount Validation (Positive Integer Paise)
       │
       ▼
5. Available Balance Check
       │
       ▼
6. Telemetry Feature Extraction (Velocity, Amount Spike, Recipient History, Hour)
       │
       ▼
7. Hybrid Fraud Engine (7 Rules + Scikit-Learn Random Forest Classifier)
       │
       ▼
8. Threshold Decision Matrix:
   ├── Score < 30   ──> APPROVED ──> Double-Entry ACID Debit & Credit ──> Receipt
   ├── Score 30-69  ──> PENDING  ──> Held for Secondary Verification (Zero Funds Moved)
   └── Score >= 70  ──> BLOCKED  ──> Auto-Blocked + Gemini AI Explanation + Alert
       │
       ▼
9. Commit Atomic Database Transaction
       │
       ▼
10. Immutable Audit Logging (Actor, IP, Action, Timestamp)
       │
       ▼
11. Return Verified JSON Receipt to Client
```

---

## 8. Automated Test Suite Results

Run the full automated test suite:
```bash
backend/venv/Scripts/python -m pytest backend/tests/test_api.py -v
```

### Verified Test Matrix (10/10 Passed):
- `test_health_check` — **PASSED** (Verifies API gateway and database connectivity).
- `test_auth_verify_otp_success` — **PASSED** (Verifies OTP verification and JWT issuance).
- `test_auth_verify_otp_incorrect` — **PASSED** (Rejects incorrect 6-digit codes with 400 Bad Request).
- `test_admin_login_success` — **PASSED** (Authenticates SOC admin credentials).
- `test_admin_login_invalid_password` — **PASSED** (Rejects invalid administrative credentials).
- `test_rbac_user_cannot_access_admin_overview` — **PASSED** (Enforces 403 Forbidden for non-admin tokens).
- `test_payment_success_atomic_ledger` — **PASSED** (Verifies atomic paise debits and balanced credits).
- `test_payment_idempotency_prevents_duplicate_debit` — **PASSED** (Prevents duplicate processing under identical keys).
- `test_payment_insufficient_balance` — **PASSED** (Rejects payments exceeding available wallet balance).
- `test_payment_blocked_for_scammer_recipient` — **PASSED** (Fraud engine automatically blocks known malicious recipients).

---

## 9. Comprehensive Documentation Index

- [System Architecture Specification](docs/architecture.md)
- [Relational Database Schema](docs/database-schema.md)
- [RESTful OpenAPI Documentation](docs/api-documentation.md)
- [DFD Level 0 — Context Diagram](docs/dfd-level-0.md)
- [DFD Level 1 — Subsystem Decomposition](docs/dfd-level-1.md)
- [DFD Level 2 — Detailed Payment Pipeline](docs/dfd-level-2.md)

---

## 10. License & Intellectual Property

Built for the RakshaPay Hackathon Demonstration.  
*RakshaPay — Pay Smart. Stay Protected.*
