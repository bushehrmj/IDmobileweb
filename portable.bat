@echo off
chcp 65001 >nul
title ID Mobile Manager Pro - نسخه Portable
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         📦 ID Mobile Manager Pro - Portable              ║
echo ║                                                           ║
echo ║         نسخه قابل حمل بدون نیاز به نصب                   ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM بررسی وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0E
    echo ⚠️  Node.js نصب نیست!
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo 📥 دانلود Node.js Portable
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo در حال دانلود Node.js...
    echo.
    
    REM دانلود Node.js portable
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip' -OutFile 'node.zip'}"
    
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
        ren "node-v20.10.0-win-x64" "node"
    )
    
    REM حذف فایل zip
    del node.zip
    
    echo ✅ Node.js portable آماده است
    echo.
    
    REM تنظیم PATH
    set PATH=%CD%\node;%PATH%
)

echo ✅ Node.js آماده است
node --version
echo.

REM بررسی نصب بودن برنامه
if not exist "node_modules" (
    echo ═══════════════════════════════════════════════════════════
    echo 📦 نصب وابستگی‌ها
    echo ═══════════════════════════════════════════════════════════
    echo.
    
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo ❌ خطا در نصب وابستگی‌ها!
        pause
        exit /b 1
    )
    
    echo ✅ نصب کامل شد
    echo.
)

REM بررسی build
if not exist "dist" (
    echo ═══════════════════════════════════════════════════════════
    echo 🔨 ساخت برنامه
    echo ═══════════════════════════════════════════════════════════
    echo.
    
    call npm run build
    
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo ❌ خطا در ساخت برنامه!
        pause
        exit /b 1
    )
    
    echo ✅ ساخت کامل شد
    echo.
)

echo ═══════════════════════════════════════════════════════════
echo 🚀 اجرای برنامه
echo ═══════════════════════════════════════════════════════════
echo.

REM دریافت IP سیستم
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo 🌐 آدرس‌های دسترسی:
echo.
echo    📍 از این کامپیوتر:
echo       http://localhost:3000
echo.
echo    📱 از موبایل/تبلت در شبکه محلی:
echo       http://%IP%:3000
echo.
echo ═══════════════════════════════════════════════════════════
echo.
echo 🔐 اطلاعات ورود:
echo.
echo    👤 نام کاربری: admin
echo    🔑 رمز عبور: admin123
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM باز کردن مرورگر بعد از 3 ثانیه
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM اجرای سرور
node server.js

pause
