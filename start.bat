@echo off
chcp 65001 >nul
title ID Mobile Manager Pro - در حال اجرا
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         🚀 ID Mobile Manager Pro                         ║
echo ║                                                           ║
echo ║         سیستم مدیریت فروشگاه موبایل                      ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM بررسی نصب بودن برنامه
if not exist "node_modules" (
    color 0E
    echo ⚠️  برنامه هنوز نصب نشده است!
    echo.
    echo لطفاً ابتدا فایل setup.bat را اجرا کنید.
    echo.
    pause
    exit /b 1
)

REM بررسی build
if not exist "dist" (
    color 0E
    echo ⚠️  برنامه هنوز build نشده است!
    echo.
    echo لطفاً ابتدا فایل setup.bat را اجرا کنید.
    echo.
    pause
    exit /b 1
)

echo ✅ برنامه آماده اجرا است
echo.
echo ═══════════════════════════════════════════════════════════
echo 📡 در حال راه‌اندازی سرور...
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
echo ⚠️  برای توقف سرور، این پنجره را ببندید یا Ctrl+C را بزنید
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM باز کردن مرورگر بعد از 3 ثانیه
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM اجرای سرور
node server.js

pause
