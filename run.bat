@echo off
title SmartConvert AI Launcher
echo ========================================================
echo               Starting SmartConvert AI
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend Server (FastAPI on http://localhost:8000)...
start "SmartConvert AI - Backend" cmd /k "cd /d ""%~dp0backend"" && .\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

echo [2/2] Starting Frontend Server (React on http://localhost:3000)...
start "SmartConvert AI - Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm start"

echo.
echo ========================================================
echo Servers are starting up!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================================
echo Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:3000
