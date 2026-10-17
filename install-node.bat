@echo off
chcp 65001 >nul
title نصب Node.js Portable
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         📥 نصب Node.js Portable                          ║
echo ║                                                           ║
echo ║         دانلود و نصب خودکار Node.js                      ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM بررسی وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ✅ Node.js قبلاً نصب شده است
    node --version
    echo.
    pause
    exit /b 0
)

echo ═══════════════════════════════════════════════════════════
echo 📥 دانلود Node.js Portable
echo ═══════════════════════════════════════════════════════════
echo.

REM دانلود Node.js portable
echo در حال دانلود Node.js v20.10.0...
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip'}"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ خطا در دانلود Node.js!
    echo.
    echo لطفاً Node.js را به صورت دستی دانلود و نصب کنید:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ دانلود کامل شد
echo.

echo ═══════════════════════════════════════════════════════════
echo 📦 استخراج فایل
echo ═══════════════════════════════════════════════════════════
echo.

echo در حال استخراج...

REM استخراج فایل
powershell -Command "& {Expand-Archive -Path 'node.zip' -DestinationPath '.' -Force}"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ خطا در استخراج!
    pause
    exit /b 1
)

echo ✅ استخراج کامل شد
echo.

REM تغییر نام پوشه
if exist "node-v20.10.0-win-x64" (
    echo در حال تنظیم پوشه...
    ren "node-v20.10.0-win-x64" "node"
)

REM حذف فایل zip
echo در حال پاکسازی...
del node.zip

echo ✅ پاکسازی کامل شد
echo.

echo ═══════════════════════════════════════════════════════════
echo ✅ نصب کامل شد
echo ═══════════════════════════════════════════════════════════
echo.

echo Node.js با موفقیت نصب شد!
echo.
echo مسیر نصب: %CD%\node
echo.
echo برای استفاده، فایل portable.bat را اجرا کنید.
echo.

pause
