@echo off
title Install ID Mobile Manager Pro
color 0A

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Installation
echo ==========================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
node --version
echo.

REM Install dependencies
echo ==========================================================
echo    Installing dependencies...
echo ==========================================================
echo.
call npm install

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo    Building project...
echo ==========================================================
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to build project!
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo    [OK] Installation completed successfully!
echo ==========================================================
echo.
echo    To run the program, double-click: start.bat
echo.
echo ==========================================================
echo.

pause
