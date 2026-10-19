@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS from https://nodejs.org, then run this file again.
  pause
  exit /b 1
)
echo Open http://localhost:3000 in your browser. Keep this window open.
node scripts/serve.mjs
pause
