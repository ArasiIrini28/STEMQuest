@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS from https://nodejs.org, then run this file again.
  pause
  exit /b 1
)
if not exist out\index.html (
  echo First start: installing dependencies and building STEMQuest. Internet is required.
  call npm.cmd ci
  if errorlevel 1 goto failed
  call npm.cmd run build
  if errorlevel 1 goto failed
)
echo Open http://localhost:3000 in your browser. Keep this window open.
node scripts/serve.mjs
pause
exit /b 0
:failed
echo Setup failed. Read the error above and docs\SETUP-WINDOWS.md.
pause
exit /b 1
