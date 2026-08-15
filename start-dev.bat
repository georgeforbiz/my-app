@echo off
cd /d "%~dp0"
echo Starting VSTAH dev server (outside OneDrive)...
call npm run dev:local
pause
