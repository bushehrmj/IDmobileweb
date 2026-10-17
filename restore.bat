@echo off
title Restore ID Mobile Manager Pro
color 0E

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Restore
echo ==========================================================
echo.

REM Check backup directory
if not exist "backup" (
    color 0C
    echo [ERROR] Backup directory not found!
    echo.
    pause
    exit /b 1
)

REM List backup files
echo [INFO] Available backup files:
echo.
dir /b backup\*.json 2>nul | findstr /n "." || echo    No files found
echo.

REM Request filename
set /p FILENAME="Enter backup filename (with .json): "

if not exist "backup\%FILENAME%" (
    color 0C
    echo.
    echo [ERROR] File not found: backup\%FILENAME%
    echo.
    pause
    exit /b 1
)

echo.
echo [WARNING] This will overwrite all current data!
echo.
set /p CONFIRM="Are you sure? (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo.
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Restoring data...
echo.

REM Import data using Node.js
node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('backup/%FILENAME%','utf8'));if(!fs.existsSync('data'))fs.mkdirSync('data');Object.keys(data).forEach(key=>{fs.writeFileSync('data/'+key+'.json',JSON.stringify(data[key],null,2))});console.log('[OK] Data restored successfully');"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================================
    echo    [OK] Restore completed successfully!
    echo ==========================================================
    echo.
    echo    Please restart the application.
    echo.
) else (
    color 0C
    echo.
    echo [ERROR] Failed to restore data!
)

echo.
pause
