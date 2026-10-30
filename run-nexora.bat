@echo off
title Nexora Voice Assistant - Jarvis Lite Desktop Bridge
echo ========================================================
echo   ⚡ NEXORA INTELLIGENT MULTIMODAL VOICE ASSISTANT ⚡
echo   Integrated with Jarvis Lite Executive Command Center
echo ========================================================
echo.
echo Modes:
echo   run-nexora.bat              - Start with interactive HUD
echo   run-nexora.bat --headless   - Run background desktop daemon
echo   run-nexora.bat --pair <code>- Authenticate with Jarvis Lite
echo.
cd nexora
python main.py %*
pause
