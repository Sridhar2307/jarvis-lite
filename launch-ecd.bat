@echo off
title JARVIS Executive Command Dashboard
cd /d "%~dp0"

echo ========================================================
echo   ⚡ JARVIS EXECUTIVE COMMAND DASHBOARD (ECD) ⚡
echo   Launching Chained Desktop Window...
echo ========================================================

:: Check if port 3000 is already active
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Next.js dev server is not running. Starting backend in background...
    start /min "Jarvis Lite Server" npm run dev
    timeout /t 3 /nobreak >nul
)

:: Find preferred browser binary for standalone App Mode
set "BROWSER_PATH="
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
)

if defined BROWSER_PATH (
    echo [INFO] Opening ECD Chained Window via %BROWSER_PATH%...
    start "" "%BROWSER_PATH%" --app="http://localhost:3000" --window-size=1360,860
) else (
    echo [INFO] Opening default browser...
    start http://localhost:3000
)

echo [SUCCESS] Chained Window launched successfully.
timeout /t 1 >nul
exit
