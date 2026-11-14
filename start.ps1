# RakshaPay PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RAKSHAPAY - AI-POWERED PAYMENT SECURITY PLATFORM" -ForegroundColor Cyan
Write-Host "  'Pay Smart. Stay Protected.'" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 1. Check Python virtual environment
if (-not (Test-Path "$rootDir\backend\venv\Scripts\python.exe")) {
    Write-Host "[*] Python venv not found. Running setup..." -ForegroundColor Yellow
    & "$rootDir\scripts\setup.bat"
}

# 2. Check ML model
if (-not (Test-Path "$rootDir\ml\models\fraud_model.joblib")) {
    Write-Host "[*] Training Random Forest Fraud Model..." -ForegroundColor Yellow
    & "$rootDir\backend\venv\Scripts\python.exe" -m ml.train
}

# 3. Check DB
if (-not (Test-Path "$rootDir\rakshapay.db")) {
    Write-Host "[*] Seeding demo database..." -ForegroundColor Yellow
    & "$rootDir\backend\venv\Scripts\python.exe" "$rootDir\scripts\seed_demo.py"
}

# 4. Launch Backend
Write-Host "[*] Launching Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\backend`" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 5. Launch Frontend
Write-Host "[*] Launching Frontend UI on http://localhost:5173 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm.cmd run dev"

# 6. Wait and open browser
Start-Sleep -Seconds 3
Write-Host "[*] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  RAKSHAPAY IS NOW RUNNING!" -ForegroundColor Green
Write-Host "  Customer Portal : http://localhost:5173"
Write-Host "  SOC Admin Portal: http://localhost:5173/admin/login"
Write-Host "  Backend API Docs: http://127.0.0.1:8000/api/docs"
Write-Host ""
Write-Host "  DEMO CREDENTIALS:"
Write-Host "  - Customer Phone: +919876543210 (OTP: 123456)"
Write-Host "  - Admin Phone   : +919999900000 (Pass: Admin@Raksha2026)"
Write-Host "========================================================" -ForegroundColor Green
