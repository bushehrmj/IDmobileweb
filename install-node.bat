@echo off
title Install Node.js Portable
color 0B

echo.
echo ==========================================================
echo    Node.js Portable Installation
echo ==========================================================
echo.

REM Check if Node.js already installed
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo [OK] Node.js is already installed
    node --version
    echo.
    pause
    exit /b 0
)

echo [INFO] Downloading Node.js Portable v20.10.0...
echo.

REM Download Node.js portable
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip'}"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to download Node.js!
    echo.
    echo Please download manually from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Download completed
echo.

echo [INFO] Extracting files...
echo.

REM Extract files
powershell -Command "& {Expand-Archive -Path 'node.zip' -DestinationPath '.' -Force}"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo [ERROR] Failed to extract files!
    pause
    exit /b 1
)

echo [OK] Extraction completed
echo.

REM Rename folder
if exist "node-v20.10.0-win-x64" (
    echo [INFO] Setting up folder...
    ren "node-v20.10.0-win-x64" "node"
)

REM Delete zip file
echo [INFO] Cleaning up...
del node.zip

echo [OK] Cleanup completed
echo.

echo ==========================================================
echo    [OK] Node.js Portable installed successfully!
echo ==========================================================
echo.
echo    Installation path: %CD%\node
echo.
echo    To use the application, run: portable.bat
echo.
echo ==========================================================
echo.

pause
