@echo off
chcp 65001 >nul
title نصب ID Mobile Manager Pro
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         نصب خودکار ID Mobile Manager Pro                 ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM بررسی Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ خطا: Node.js نصب نیست!
    echo.
    echo لطفاً Node.js را از سایت رسمی دانلود و نصب کنید:
    echo https://nodejs.org/
    echo.
    echo نسخه پیشنهادی: LTS (Long Term Support)
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js پیدا شد
node --version
echo.

REM بررسی npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ خطا: npm نصب نیست!
    pause
    exit /b 1
)

echo ✅ npm پیدا شد
npm --version
echo.

echo ═══════════════════════════════════════════════════════════
echo 📦 در حال نصب وابستگی‌ها...
echo ═══════════════════════════════════════════════════════════
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ❌ خطا در نصب وابستگی‌ها!
    echo.
    echo لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo 🔨 در حال ساخت برنامه...
echo ═══════════════════════════════════════════════════════════
echo.

call npm run build

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ❌ خطا در ساخت برنامه!
    pause
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║              ✅ نصب با موفقیت انجام شد!                  ║
echo ║                                                           ║
echo ║   برای اجرای برنامه، فایل start.bat را اجرا کنید        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM ایجاد میانبر روی دسکتاپ
echo در حال ایجاد میانبر روی دسکتاپ...

set SCRIPT="%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\ID Mobile Manager Pro.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0start.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "ID Mobile Manager Pro" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo ✅ میانبر روی دسکتاپ ایجاد شد
echo.

pause
