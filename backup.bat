@echo off
title Backup ID Mobile Manager Pro
color 0A

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Backup
echo ==========================================================
echo.

REM Create backup directory
if not exist "backup" mkdir backup

REM Create timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YEAR=%dt:~0,4%"
set "MONTH=%dt:~4,2%"
set "DAY=%dt:~6,2%"
set "HOUR=%dt:~8,2%"
set "MINUTE=%dt:~10,2%"

set "FILENAME=backup\idmobile_backup_%YEAR%-%MONTH%-%DAY%_%HOUR%-%MINUTE%.json"

echo [INFO] Creating backup...
echo.
echo    File: %FILENAME%
echo.

REM Export localStorage data using Node.js
node -e "const fs=require('fs');const data={};const files=['users','products','customers','sales','purchases','repairs','settings'];files.forEach(f=>{const p='data/'+f+'.json';if(fs.existsSync(p))data[f]=JSON.parse(fs.readFileSync(p,'utf8'))});fs.writeFileSync('%FILENAME%',JSON.stringify(data,null,2));console.log('[OK] Backup created successfully');"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================================
    echo    [OK] Backup completed successfully!
    echo ==========================================================
    echo.
    echo    Backup file: %FILENAME%
    echo.
) else (
    color 0C
    echo.
    echo [ERROR] Failed to create backup!
)

echo.
pause
