@echo off
title SmartConvert AI - Backend
cd /d "%~dp0backend"
echo Starting Backend on http://localhost:8000 ...
.\venv\Scripts\uvicorn.exe main:app --reload --port 8000
pause
