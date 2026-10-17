@echo off
title Password Reset Tool
color 0B

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Password Reset
echo ==========================================================
echo.
echo    Opening password reset tool...
echo.

REM Open the reset password HTML file in default browser
start "" "%~dp0reset-password.html"

echo [OK] Password reset tool opened in your browser
echo.
echo ==========================================================
echo    Instructions:
echo ==========================================================
echo.
echo    1. The tool will initialize the database automatically
echo    2. Enter your new password (minimum 6 characters)
echo    3. Confirm the password
echo    4. Click "Reset Password" button
echo    5. Login at http://localhost:3000 with new password
echo.
echo ==========================================================
echo.

timeout /t 5 /nobreak >nul
