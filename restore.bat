@echo off
chcp 65001 >nul
title بازیابی پشتیبان ID Mobile Manager Pro
color 0E

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         🔄 بازیابی از پشتیبان                             ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM بررسی وجود پوشه backup
if not exist "backup" (
    color 0C
    echo ❌ پوشه backup وجود ندارد!
    echo.
    pause
    exit /b 1
)

REM لیست فایل‌های پشتیبان
echo 📂 فایل‌های پشتیبان موجود:
echo.
dir /b backup\*.json 2>nul | findstr /n "." || echo    هیچ فایلی یافت نشد
echo.

REM درخواست نام فایل
set /p FILENAME="نام فایل پشتیبان را وارد کنید (با پسوند .json): "

if not exist "backup\%FILENAME%" (
    color 0C
    echo.
    echo ❌ فایل یافت نشد: backup\%FILENAME%
    echo.
    pause
    exit /b 1
)

echo.
echo ⚠️  هشدار: این عملیات تمام داده‌های فعلی را بازنویسی می‌کند!
echo.
set /p CONFIRM="آیا مطمئن هستید؟ (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo.
    echo عملیات لغو شد.
    pause
    exit /b 0
)

echo.
echo 🔄 در حال بازیابی...
echo.

REM اجرای script بازیابی
node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('backup/%FILENAME%', 'utf8')); if (!fs.existsSync('data')) fs.mkdirSync('data'); Object.keys(data).forEach(key => { fs.writeFileSync('data/' + key + '.json', JSON.stringify(data[key], null, 2)); }); console.log('✅ بازیابی با موفقیت انجام شد');"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║                                                           ║
    echo ║              ✅ بازیابی موفق                              ║
    echo ║                                                           ║
    echo ║   داده‌ها با موفقیت بازیابی شدند                        ║
    echo ║                                                           ║
    echo ║   لطفاً برنامه را مجدداً اجرا کنید                      ║
    echo ║                                                           ║
    echo ╚═══════════════════════════════════════════════════════════╝
) else (
    color 0C
    echo.
    echo ❌ خطا در بازیابی!
)

echo.
pause
