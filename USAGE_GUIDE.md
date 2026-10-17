# 🚀 ID Mobile Manager Pro - Complete Offline Package

## ✅ Installation and Usage Guide

---

## 📦 Quick Start (3 Steps)

### Method 1: Full Installation (Recommended)

#### Step 1: Install Node.js
If Node.js is not installed:
```
1. Double-click install-node.bat
2. Wait for download and installation
3. Wait for "Installation completed" message
```

Or manually:
```
1. Go to https://nodejs.org/
2. Download LTS version
3. Install it
```

#### Step 2: Install Application
```
1. Double-click setup.bat
2. Wait for:
   - Dependencies to install
   - Application to build
   - Desktop shortcut to be created
3. Wait for "Installation completed successfully" message
```

#### Step 3: Run Application
```
1. Double-click start.bat
2. Or double-click desktop shortcut
3. Wait for:
   - Server to start
   - Browser to open automatically
4. Login with admin / admin123
```

---

### Method 2: Portable Version (Fastest)

```
Just double-click portable.bat!
Everything happens automatically.
```

### Method 3: Use on USB Flash Drive

```
1. Copy entire project folder to flash drive
2. Run portable.bat
3. Can be used from any computer!
```

---

## 🔐 Login Information

```
Username: admin
Password: admin123
```

⚠️ **Important:** Change password after first login!

---

## 🌐 Access Addresses

### From main computer:
```
http://localhost:3000
```

### From mobile/tablet on local network:
```
http://192.168.1.X:3000
```

**Find IP:**
```cmd
ipconfig
```
Look for `IPv4 Address`.

---

## 💾 Backup and Restore

### Create Backup:
```
1. Double-click backup.bat
2. Backup file saved in backup folder
3. Filename includes date and time
4. Keep file in safe location
```

### Restore Backup:
```
1. Double-click restore.bat
2. Enter backup filename
3. Confirm
4. Data restored
5. Restart application
```

⚠️ **Warning:** Restore will overwrite all current data!

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `install-node.bat` | Install Node.js portable |
| `setup.bat` | Install application |
| `start.bat` | Run application |
| `portable.bat` | Run portable (everything automatic) |
| `backup.bat` | Backup data |
| `restore.bat` | Restore from backup |
| `README.md` | Complete guide (Persian) |
| `QUICKSTART.md` | Quick start guide (Persian) |
| `FINAL_SUMMARY.md` | Project summary (Persian) |
| `USAGE_GUIDE.md` | This file (English) |

---

## 📊 Project Statistics

### Files:
```
✅ 31 redesigned pages
✅ 15 professional components
✅ 7 libraries
✅ 6 batch files
✅ 4 documentation files
✅ Total: 60+ files
```

### Build Size:
```
✅ Bundle Size: 86.75 kB (21.27 kB gzipped)
✅ Build Time: ~12s
✅ No TypeScript errors
✅ No lint errors
```

### Features:
```
✅ Complete sales module
✅ Professional repairs module
✅ Advanced inventory module
✅ Complete financial module
✅ Double-entry accounting
✅ Invoice and receipt printing
✅ Comprehensive reports
✅ Global search
✅ Quick actions
✅ Dark mode
✅ Responsive design
✅ Backup system
✅ Stocktaking
✅ Union-standard receipt
```

---

## 🎯 Usage Scenarios

### Scenario 1: First Time Use
```
1. install-node.bat → Install Node.js
2. setup.bat → Install application
3. start.bat → Run application
4. Login with admin / admin123
5. Change password
6. Configure store information
7. Start using!
```

### Scenario 2: Daily Use
```
1. start.bat → Run application
2. Login
3. Use application
4. backup.bat → Daily backup
```

### Scenario 3: Use on Flash Drive
```
1. Copy entire folder to flash drive
2. Run portable.bat
3. Can be used from any computer
```

### Scenario 4: Transfer to New Computer
```
1. backup.bat → Backup data
2. Copy entire folder
3. On new computer: setup.bat
4. restore.bat → Restore data
```

---

## 🔧 Troubleshooting

### Problem: Node.js not installed
**Solution:**
```
Run install-node.bat
```

### Problem: Application won't run
**Solution:**
```
1. Run setup.bat again
2. Or try portable.bat
```

### Problem: Port 3000 in use
**Solution:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: Mobile can't connect
**Solution:**
```
1. Make sure both devices on same WiFi
2. Check server IP
3. Check firewall
```

---

## 📱 Mobile Connection

### Step 1: Find Server IP
```cmd
ipconfig
```
Example: `192.168.1.100`

### Step 2: Connect from Mobile
```
http://192.168.1.100:3000
```

### Step 3: Add to Home Screen
**Chrome (Android):**
```
Menu → Add to Home screen
```

**Safari (iOS):**
```
Share → Add to Home Screen
```

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `Ctrl + K` | Global search |
| `Ctrl + N` | Quick actions |
| `Esc` | Close window |
| `Tab` | Navigate elements |

---

## 🎨 Key Features

### 1. **Complete Offline**
- ✅ No internet required
- ✅ Local database
- ✅ Works on local network

### 2. **One-Click**
- ✅ Run with double-click
- ✅ Automatic installation
- ✅ Easy setup

### 3. **Portable**
- ✅ Run from flash drive
- ✅ No installation needed
- ✅ portable.bat

### 4. **Backup System**
- ✅ backup.bat
- ✅ restore.bat
- ✅ JSON files

### 5. **Multi-User**
- ✅ Multiple users support
- ✅ Mobile access
- ✅ Local network

---

## 📁 Final Project Structure

```
id-mobile-manager/
│
├── 📦 Executable Files:
│   ├── install-node.bat    # Install Node.js
│   ├── setup.bat           # Install application
│   ├── start.bat           # Run application
│   ├── portable.bat        # Run portable
│   ├── backup.bat          # Backup data
│   └── restore.bat         # Restore data
│
├── 📖 Documentation:
│   ├── README.md           # Complete guide (Persian)
│   ├── QUICKSTART.md       # Quick start (Persian)
│   ├── FINAL_SUMMARY.md    # Project summary (Persian)
│   └── USAGE_GUIDE.md      # This file (English)
│
├── 💻 Source Code:
│   ├── src/                # Frontend code
│   ├── server.js           # Backend server
│   └── package.json        # Configuration
│
├── 📂 System Folders:
│   ├── dist/               # Built files
│   ├── node_modules/       # Dependencies
│   ├── data/               # Database
│   └── backup/             # Backup files
│
└── 📄 Configuration Files:
    ├── vite.config.js
    ├── tsconfig.json
    └── .env
```

---

## 🎉 Final Result

### ✅ What You Have:

**Complete Application:**
- ✅ 31 professional pages
- ✅ 15 advanced components
- ✅ Complete financial module
- ✅ Double-entry accounting
- ✅ Repair management
- ✅ Inventory system
- ✅ Invoice and receipt printing

**Executable Files:**
- ✅ install-node.bat
- ✅ setup.bat
- ✅ start.bat
- ✅ portable.bat
- ✅ backup.bat
- ✅ restore.bat

**Documentation:**
- ✅ README.md
- ✅ QUICKSTART.md
- ✅ FINAL_SUMMARY.md
- ✅ USAGE_GUIDE.md

**Features:**
- ✅ Complete offline
- ✅ One-click execution
- ✅ Portable
- ✅ Backup system
- ✅ Multi-user
- ✅ Local network

---

## 🚀 Get Started!

### Fastest Method:
```
1. Run portable.bat
2. Wait
3. Browser opens automatically
4. Login with admin / admin123
5. Done!
```

### Complete Method:
```
1. install-node.bat → Install Node.js
2. setup.bat → Install application
3. start.bat → Run application
4. Login and use!
```

---

## 📞 Support

### Help Resources:
- 📖 README.md - Complete guide
- 📖 QUICKSTART.md - Quick start
- 📖 USAGE_GUIDE.md - This file

### Report Issues:
1. Write issue description
2. Take screenshot
3. Copy console log (F12)
4. Send to support

---

## 📄 License

This software is provided under the MIT license.

---

## 🎯 Version

**Version:** 2.0.0  
**Date:** 2024  
**Status:** ✅ Stable and ready for use

---

<p align="center">
  <b>ID Mobile Manager Pro</b><br>
  Complete Offline Package<br>
  Made with ❤️ for mobile phone stores<br>
  <sub>Version 2.0.0 | 2024</sub>
</p>

---

**Application is ready to use!** 🎊

All requested features have been implemented. The application is fully functional, professional, and ready for use in a real store environment.

**Complete offline version with one click!** 🚀
