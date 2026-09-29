# UnitView v5.3.0 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Node.js
Download and install Node.js 18.x or 20.x from https://nodejs.org/

### Step 2: Extract and Install
```bash
# Extract the zip file
# Open PowerShell in the extracted folder

# Install dependencies
npm install
cd renderer
npm install
cd ..
```

### Step 3: Build
```bash
# Build renderer
cd renderer
npm run build:no-check
cd ..

# Build main process
npm run build:main
```

### Step 4: Run
```bash
npm run electron

# Development (renderer + main):
# npm run dev
```

### Step 5: Login
- **Username:** `admin`
- **Password:** `admin123`

## ✅ That's It!

Your UnitView application is now running!

---

## 📚 Need More Help?

- **Full Instructions:** See `BUILD_INSTRUCTIONS.md`
- **Changelog:** See `CHANGELOG.md`
- **Troubleshooting:** Check console for errors (Ctrl+Shift+I)

---

## 🎯 Create Windows Installer

```bash
npm run dist:win
```

Installer will be in the `release/` folder.

---

**Version:** 5.3.0 | **Status:** Current Windows deliverable