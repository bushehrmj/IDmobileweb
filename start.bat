@echo off
title ID Mobile Manager Pro
color 0B

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║        ID Mobile Manager Pro - Start Script         ║
echo ╠══════════════════════════════════════════════════════╣
echo ║                                                      ║
echo ║  Starting unified server (Frontend + Backend)...    ║
echo ║                                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Check if dist exists
if not exist "dist" (
    echo [INFO] Building project...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to build project!
        pause
        exit /b 1
    )
)

REM Create data directory if not exists
if not exist "data" (
    echo [INFO] Creating data directory...
    mkdir data
)

REM Start unified server
echo [INFO] Starting unified server on port 3000...
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  Server is running!                                  ║
echo ║                                                      ║
echo ║  Open in browser:                                    ║
echo ║    http://localhost:3000                             ║
echo ║                                                      ║
echo ║  API Endpoint:                                       ║
echo ║    http://localhost:3000/api                         ║
echo ║                                                      ║
echo ║  Default login:                                      ║
echo ║    Username: admin                                   ║
echo ║    Password: admin123                                ║
echo ║                                                      ║
echo ║  Database: SQLite (data/idmobile.db)                ║
echo ║                                                      ║
echo ║  Press Ctrl+C to stop the server                    ║
echo ╚══════════════════════════════════════════════════════╝
echo.

node server.js

pause
