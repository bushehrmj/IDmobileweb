// ============================================================
// ID Mobile Manager Pro - Password Reset Script
// ============================================================
// نحوه استفاده:
// 1. مرورگر را باز کنید (Chrome, Firefox, Edge)
// 2. به آدرس http://localhost:3000 بروید
// 3. کلید F12 را بزنید تا Developer Tools باز شود
// 4. به تب Console بروید
// 5. این کد را کپی و Paste کنید
// 6. Enter را بزنید
// ============================================================

(function() {
    'use strict';
    
    console.log('%c🔐 ID Mobile Manager Pro - Password Reset', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%c========================================', 'color: #667eea;');
    
    // Simple hash function (same as in the app)
    function hashPassword(password) {
        let hash = 0;
        const salt = 'idmobile_salt_2024';
        const salted = salt + password + salt;
        for (let i = 0; i < salted.length; i++) {
            const char = salted.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(salted).slice(0, 20);
    }
    
    // Get users from localStorage
    const usersData = localStorage.getItem('idmobile_users');
    
    if (!usersData) {
        console.error('%c❌ Error: No users data found in localStorage', 'color: red; font-weight: bold;');
        console.log('%c💡 Please run the application first (start.bat)', 'color: blue;');
        return;
    }
    
    const users = JSON.parse(usersData);
    const adminUser = users.find(u => u.username === 'admin');
    
    if (!adminUser) {
        console.error('%c❌ Error: Admin user not found', 'color: red; font-weight: bold;');
        return;
    }
    
    // Ask for new password
    const newPassword = prompt('Enter new password for admin (minimum 6 characters):');
    
    if (!newPassword) {
        console.log('%c⚠️ Cancelled by user', 'color: orange;');
        return;
    }
    
    if (newPassword.length < 6) {
        console.error('%c❌ Error: Password must be at least 6 characters', 'color: red; font-weight: bold;');
        return;
    }
    
    // Confirm password
    const confirmPassword = prompt('Confirm new password:');
    
    if (newPassword !== confirmPassword) {
        console.error('%c❌ Error: Passwords do not match', 'color: red; font-weight: bold;');
        return;
    }
    
    // Update password
    adminUser.passwordHash = hashPassword(newPassword);
    
    // Save back to localStorage
    localStorage.setItem('idmobile_users', JSON.stringify(users));
    
    // Success message
    console.log('%c✅ Success! Password has been reset', 'color: green; font-size: 14px; font-weight: bold;');
    console.log('%c========================================', 'color: green;');
    console.log('%c📋 Login Information:', 'color: blue; font-weight: bold;');
    console.log('%c   Username: admin', 'color: blue;');
    console.log('%c   Password: ' + newPassword, 'color: blue;');
    console.log('%c========================================', 'color: blue;');
    console.log('%c💡 You can now login with the new password', 'color: green;');
    console.log('%c🔗 Go to: http://localhost:3000', 'color: #667eea; font-weight: bold;');
    
    // Alert user
    alert('✅ Password reset successful!\n\nUsername: admin\nPassword: ' + newPassword + '\n\nYou can now login at http://localhost:3000');
    
})();
