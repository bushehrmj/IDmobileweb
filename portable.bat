@echo off
title ID Mobile Manager Pro - Portable
color 0B

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Portable Version
echo ==========================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo [WARNING] Node.js not found!
    echo.
    echo ==========================================================
    echo    Downloading Node.js Portable
    echo ==========================================================
    echo.
    echo Downloading Node.js...
    echo.
    
    REM Download Node.js portable
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip'}"
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Failed to download Node.js!
        echo.
        echo Please download manually from: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
    
    echo [OK] Download completed
    echo.
    echo Extracting...
    
    REM Extract files
    powershell -Command "& {Expand-Archive -Path 'node.zip' -DestinationPath '.' -Force}"
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Failed to extract!
        pause
        exit /b 1
    )
    
    echo [OK] Extraction completed
    echo.
    
    REM Rename folder
    if exist "node-v20.10.0-win-x64" (
        ren "node-v20.10.0-win-x64" "node"
    )
    
    REM Delete zip file
    del node.zip
    
    echo [OK] Node.js portable ready
    echo.
    
    REM Set PATH
    set PATH=%CD%\node;%PATH%
)

echo [OK] Node.js ready
node --version
echo.

REM Check if dependencies installed
if not exist "node_modules" (
    echo ==========================================================
    echo    Installing dependencies...
    echo ==========================================================
    echo.
    
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    
    echo [OK] Installation completed
    echo.
)

REM Check if built
if not exist "dist" (
    echo ==========================================================
    echo    Building project...
    echo ==========================================================
    echo.
    
    call npm run build
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Failed to build!
        pause
        exit /b 1
    )
    
    echo [OK] Build completed
    echo.
)

echo ==========================================================
echo    Starting server...
echo ==========================================================
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo [OK] Server addresses:
echo.
echo    From this computer:
echo       http://localhost:3000
echo.
echo    From mobile/tablet on same WiFi:
echo       http://%IP%:3000
echo.
echo ==========================================================
echo.
echo    Login information:
echo.
echo       Username: admin
echo       Password: admin123
echo.
echo ==========================================================
echo.

REM Open browser after 3 seconds
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM Start server
node server.js

pause
