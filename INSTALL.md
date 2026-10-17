# 📦 راهنمای نصب و راه‌اندازی

## ⚠️ حل مشکل نصب

اگر با خطای `ERR_MODULE_NOT_FOUND` مواجه شدید، مراحل زیر را دنبال کنید:

### مرحله 1: پاک کردن node_modules قدیمی

```bash
# در ویندوز (Command Prompt یا PowerShell)
rmdir /s /q node_modules
del package-lock.json

# در مک/لینوکس
rm -rf node_modules package-lock.json
```

### مرحله 2: نصب وابستگی‌ها

```bash
npm install
```

### مرحله 3: Build پروژه

```bash
npm run build
```

### مرحله 4: اجرای سرور

```bash
node server.js
```

---

## 🔧 اگر مشکل better-sqlite3 دارید

اگر خطای مربوط به `better-sqlite3` دریافت کردید:

### راه‌حل 1: حذف better-sqlite3

```bash
npm uninstall better-sqlite3
npm install sql.js
```

### راه‌حل 2: نصب Build Tools (ویندوز)

اگر می‌خواهید از `better-sqlite3` استفاده کنید:

1. **نصب Visual Studio Build Tools:**
   - دانلود از: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - نصب با گزینه "Desktop development with C++"

2. **نصب Python:**
   - دانلود از: https://www.python.org/
   - نسخه 3.x

3. **سپس دوباره نصب کنید:**
   ```bash
   npm install
   ```

---

## 🚀 راه‌اندازی سریع (توصیه شده)

### برای ویندوز:

```bash
# 1. پاک کردن
rmdir /s /q node_modules
del package-lock.json

# 2. نصب
npm install

# 3. Build
npm run build

# 4. اجرا
node server.js
```

### یا فقط روی `start.bat` دابل کلیک کنید!

---

## 📋 بررسی نصب صحیح

بعد از `npm install`، باید این پکیج‌ها نصب شده باشند:

### پکیج‌های اصلی:
- ✅ express
- ✅ cors
- ✅ bcrypt
- ✅ jsonwebtoken
- ✅ sql.js
- ✅ react
- ✅ react-dom
- ✅ typescript
- ✅ vite
- ✅ tailwindcss

### بررسی:
```bash
npm list --depth=0
```

---

## 🐛 عیب‌یابی

### خطا: Cannot find package 'express'

**علت:** پکیج‌ها نصب نشده‌اند

**راه‌حل:**
```bash
npm install
```

### خطا: better-sqlite3 binding not found

**علت:** `better-sqlite3` نیاز به compilation دارد

**راه‌حل:**
```bash
npm uninstall better-sqlite3
npm install sql.js
```

### خطا: EADDRINUSE: address already in use

**علت:** پورت 3000 در حال استفاده است

**راه‌حل:**
```bash
# ویندوز
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# یا از پورت دیگر استفاده کنید
set PORT=3001
node server.js
```

### خطا: Cannot find module '...'

**علت:** فایل‌ها ناقص هستند

**راه‌حل:**
```bash
npm install
npm run build
```

---

## 📊 ساختار نهایی

```
id-mobile-manager/
├── server.js              # ✅ Unified Server (ES Module)
├── start.bat              # ✅ Start Script (ویندوز)
├── package.json           # Dependencies
├── .env                   # Environment variables
├── data/
│   └── idmobile.db       # SQLite Database (auto-created)
├── dist/                  # Built frontend
├── src/                   # Source code
└── node_modules/          # Dependencies
```

---

## 🎯 اجرای موفق

بعد از اجرای `node server.js`، باید این پیام را ببینید:

```
╔══════════════════════════════════════════════════════╗
║        ID Mobile Manager Pro - Unified Server       ║
╠══════════════════════════════════════════════════════╣
║  Server running on port 3000                        ║
║                                                      ║
║  Access from this computer:                          ║
║    → http://localhost:3000                          ║
║                                                      ║
║  Access from mobile/tablet on same WiFi:            ║
║    → http://192.168.1.X:3000                        ║
║                                                      ║
║  Default login: admin / admin123                    ║
║  (Change password on first login)                   ║
║                                                      ║
║  Database: SQLite (data/idmobile.db)                ║
║  API: http://localhost:3000/api                     ║
║                                                      ║
║  Press Ctrl+C to stop the server                    ║
╚══════════════════════════════════════════════════════╝

📦 Initializing database...
✅ New database created
✅ Default admin user created
   Username: admin
   Password: admin123
✅ Database schema initialized
```

---

## 🔐 اطلاعات ورود

| فیلد | مقدار |
|------|-------|
| **URL** | `http://localhost:3000` |
| **Username** | `admin` |
| **Password** | `admin123` |

> ⚠️ **مهم:** پس از اولین ورود، رمز عبور را تغییر دهید!

---

## 📱 دسترسی از موبایل

1. IP کامپیوتر سرور را پیدا کنید:
   ```bash
   # ویندوز
   ipconfig
   
   # مک/لینوکس
   ifconfig
   ```

2. در موبایل وارد شوید:
   ```
   http://192.168.1.X:3000
   ```

---

## ✅ چک‌لیست نصب

- [ ] Node.js 18+ نصب شده است
- [ ] `node_modules` پاک شده است
- [ ] `npm install` اجرا شده است
- [ ] `npm run build` اجرا شده است
- [ ] `node server.js` اجرا شده است
- [ ] سرور روی پورت 3000 در حال اجرا است
- [ ] می‌توانید وارد شوید با `admin` / `admin123`
- [ ] Database در `data/idmobile.db` ایجاد شده است

---

## 🆘 پشتیبانی

اگر هنوز مشکل دارید:

1. **لاگ خطا را کپی کنید**
2. **نسخه Node.js را بررسی کنید:**
   ```bash
   node --version
   ```
3. **نسخه npm را بررسی کنید:**
   ```bash
   npm --version
   ```
4. **لیست پکیج‌های نصب شده:**
   ```bash
   npm list --depth=0
   ```

---

**موفق باشید!** 🚀
