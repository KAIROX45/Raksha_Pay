@echo off
echo ========================================================
echo  RakshaPay Setup Automation (Windows)
echo  AI-Powered Smart Payment Security Platform
echo ========================================================

echo [1/4] Setting up Python virtual environment...
python -m venv backend\venv
call backend\venv\Scripts\activate
pip install --upgrade pip
pip install -r backend\requirements.txt

echo [2/4] Training Random Forest Fraud Detection Model...
python -m ml.train

echo [3/4] Seeding Demo Database...
python scripts\seed_demo.py

echo [4/4] Setting up Frontend dependencies...
cd frontend
call npm install
call npm run build
cd ..

echo ========================================================
echo  Setup Complete!
echo  To start the backend API:
echo    cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload --port 8000
echo  To start the frontend UI:
echo    cd frontend ^&^& npm run dev
echo ========================================================
