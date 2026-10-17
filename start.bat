@echo off
title Start ID Mobile Manager Pro
color 0B

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Starting Server
echo ==========================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    color 0E
    echo [WARNING] Dependencies not installed!
    echo.
    echo Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

REM Check if dist exists
if not exist "dist" (
    color 0E
    echo [WARNING] Project not built!
    echo.
    echo Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

echo [OK] Starting server on port 3000...
echo.
echo ==========================================================
echo    Server is running!
echo ==========================================================
echo.
echo    Open in browser:
echo      http://localhost:3000
echo.
echo    Default login:
echo      Username: admin
echo      Password: admin123
echo.
echo    Press Ctrl+C to stop the server
echo ==========================================================
echo.

node server.js

pause
