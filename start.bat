@echo off
title RakshaPay - AI-Powered Payment Security Platform
color 0A

echo ========================================================
echo   RAKSHAPAY - AI-POWERED PAYMENT SECURITY PLATFORM
echo   "Pay Smart. Stay Protected."
echo ========================================================
echo.

cd /d "%~dp0"

REM 1. Verify Python virtual environment
if not exist "backend\venv\Scripts\python.exe" (
    echo [*] Python virtual environment not found. Setting up...
    call scripts\setup.bat
)

REM 2. Verify ML Model exists
if not exist "ml\models\fraud_model.joblib" (
    echo [*] Training Random Forest Fraud Model...
    backend\venv\Scripts\python.exe -m ml.train
)

REM 3. Verify Database is initialized
if not exist "rakshapay.db" (
    echo [*] Seeding demo database...
    backend\venv\Scripts\python.exe scripts\seed_demo.py
)

REM 4. Verify Frontend node_modules
if not exist "frontend\node_modules" (
    echo [*] Installing frontend npm packages...
    cd frontend && call npm.cmd install && cd ..
)

echo [*] Launching RakshaPay Backend API on http://127.0.0.1:8000 ...
start "RakshaPay Backend API (:8000)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Launching RakshaPay Frontend on http://localhost:5173 ...
start "RakshaPay Frontend UI (:5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo [*] Waiting 3 seconds for services to initialize...
timeout /t 3 /nobreak >nul

echo [*] Opening RakshaPay in your default web browser...
start http://localhost:5173

echo.
echo ========================================================
echo   RAKSHAPAY IS NOW RUNNING SUCCESSFULLY!
echo ========================================================
echo.
echo   [PORTALS]
echo   - Customer Portal  : http://localhost:5173
echo   - SOC Admin Portal : http://localhost:5173/admin/login
echo   - Interactive Docs : http://127.0.0.1:8000/api/docs
echo.
echo   [PRE-CONFIGURED DEMO CREDENTIALS]
echo   - Customer Phone   : +919876543210
echo   - Customer OTP     : 123456 (Simulated Balance: Rs 50,000)
echo.
echo   - Peer Phone       : +919876543211
echo   - Peer OTP         : 123456 (Simulated Balance: Rs 25,000)
echo.
echo   - SOC Admin Phone  : +919999900000
echo   - SOC Admin Pass   : Admin@Raksha2026
echo.
echo   [SIMULATED RECIPIENTS TO TEST]
echo   - aman@raksha           (Clean Peer - Approved)
echo   - quickmart@upi         (Clean Merchant - Approved)
echo   - techsupport@fakeupi   (Scam Phisher - Auto-BLOCKED)
echo   - electricityboard@urgentpay (Impersonator - Held PENDING)
echo.
echo ========================================================
echo   To STOP the application:
echo   Close the two opened command prompt windows
echo   (Backend API and Frontend UI).
echo ========================================================
echo.
echo Press any key to close this launcher window...
pause >nul
