@echo off
title Password Reset Tool
color 0B

echo.
echo ==========================================================
echo    ID Mobile Manager Pro - Password Reset
echo ==========================================================
echo.
echo    Opening password reset tool in browser...
echo.

REM Open the reset password HTML file in default browser
start "" "reset-password.html"

echo [OK] Password reset tool opened in your browser
echo.
echo ==========================================================
echo    Instructions:
echo ==========================================================
echo.
echo    1. Enter new password in the form
echo    2. Confirm the password
echo    3. Click "Reset Password" button
echo    4. Login with new password at http://localhost:3000
echo.
echo ==========================================================
echo.

pause
