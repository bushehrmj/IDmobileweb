@echo off
chcp 65001 >nul
title پشتیبان‌گیری ID Mobile Manager Pro
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║         💾 پشتیبان‌گیری از داده‌ها                        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM ایجاد پوشه backup
if not exist "backup" mkdir backup

REM ایجاد نام فایل با تاریخ
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YEAR=%dt:~0,4%"
set "MONTH=%dt:~4,2%"
set "DAY=%dt:~6,2%"
set "HOUR=%dt:~8,2%"
set "MINUTE=%dt:~10,2%"

set "FILENAME=backup\idmobile_backup_%YEAR%-%MONTH%-%DAY%_%HOUR%-%MINUTE%.json"

echo 📁 در حال ایجاد پشتیبان...
echo.
echo    فایل: %FILENAME%
echo.

REM اجرای script پشتیبان‌گیری
node -e "const fs = require('fs'); const data = {}; const files = ['users', 'products', 'customers', 'sales', 'purchases', 'repairs', 'settings']; files.forEach(f => { const path = 'data/' + f + '.json'; if (fs.existsSync(path)) data[f] = JSON.parse(fs.readFileSync(path, 'utf8')); }); fs.writeFileSync('%FILENAME%', JSON.stringify(data, null, 2)); console.log('✅ پشتیبان با موفقیت ایجاد شد');"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔═══════════════════════════════════════════════════════════╗
    echo ║                                                           ║
    echo ║              ✅ پشتیبان‌گیری موفق                         ║
    echo ║                                                           ║
    echo ║   فایل پشتیبان در پوشه backup ذخیره شد                  ║
    echo ║                                                           ║
    echo ╚═══════════════════════════════════════════════════════════╝
) else (
    color 0C
    echo.
    echo ❌ خطا در ایجاد پشتیبان!
)

echo.
pause
