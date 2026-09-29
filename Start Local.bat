@echo off
setlocal
cd /d "%~dp0"

where vercel >nul 2>nul
if errorlevel 1 (
  echo Vercel CLI is required to run the frontend and API locally.
  echo Install it with: npm install -g vercel
  pause
  exit /b 1
)

start "BWM KUL City Walk" http://localhost:3000
vercel dev
pause
