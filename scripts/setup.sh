#!/usr/bin/env bash
set -e

echo "========================================================"
echo " RakshaPay Setup Automation (Linux/macOS)"
echo " AI-Powered Smart Payment Security Platform"
echo "========================================================"

echo "[1/4] Setting up Python virtual environment..."
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "[2/4] Training Random Forest Fraud Detection Model..."
python3 -m ml.train

echo "[3/4] Seeding Demo Database..."
python3 scripts/seed_demo.py

echo "[4/4] Setting up Frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo "========================================================"
echo " Setup Complete!"
echo " To start backend: source backend/venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo " To start frontend: cd frontend && npm run dev"
echo "========================================================"
