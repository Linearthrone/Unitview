# UnitView v5.3.0 - Complete Build Instructions

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Building the Application](#building-the-application)
4. [Running the Application](#running-the-application)
5. [Creating Windows Installer](#creating-windows-installer)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Windows 10 or 11** (64-bit)
- **Node.js 18.x or 20.x** (Download from https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

### Verify Installation
Open PowerShell or Command Prompt and run:

```bash
node --version
# Should show: v18.x.x or v20.x.x

npm --version
# Should show: 9.x.x or higher
```

### Disk Space Requirements
- **Source Code:** ~50MB
- **Dependencies:** ~500MB
- **Build Output:** ~200MB
- **Total Required:** ~1GB free space

---

## Installation

### Step 1: Extract Source Code

1. Extract `unitview-v5.0.1-complete.zip` to your desired location
2. Example: `C:\Projects\unitview-windows\`

### Step 2: Install Dependencies

Open PowerShell or Command Prompt in the extracted directory:

```bash
# Navigate to the project directory
cd C:\Projects\unitview-windows

# Install main process dependencies
npm install

# Install renderer dependencies
cd renderer
npm install
cd ..
```

**Expected Output:**
```
added XXX packages in XXs
```

**If you see errors:**
- Try deleting `node_modules` and `package-lock.json`
- Run `npm install` again
- Check your internet connection

---

## Building the Application

### Option 1: Full Build (Release Path, Recommended)

```bash
# From the main directory (unitview-windows)
# Renderer typecheck + renderer bundle + main process compile
npm run build
```

### Option 2: Fast Local Build (No Renderer Typecheck)

```bash
# Use only for local iteration speed; not for release validation
npm run build:renderer:fast
npm run build:main
```

### Build Output

After successful build, you should see:

```
unitview-windows/
├── dist/
│   ├── main.js          # Compiled main process
│   └── preload.js       # Compiled preload script
└── renderer/
    └── dist/
        ├── index.html   # Main HTML file
        └── assets/      # Compiled CSS and JS
```

### Verify Build Success

```bash
# Check if main.js exists
dir dist\main.js

# Check if renderer dist exists
dir renderer\dist\index.html
```

---

## Running the Application

### Development Mode

**Option A: Using npm scripts (if dev script works)**

```bash
npm run dev
```

**Option B: Manual start (if dev script has issues)**

Terminal 1 - Start renderer dev server:
```bash
cd renderer
npm run dev
```

Terminal 2 - Start Electron:
```bash
npm run dev:main
```

### Production Mode

After building, run the compiled application:

```bash
npm run electron
```

Or directly:
```bash
npx electron dist/main.js
```

### First Launch

1. Application window should open
2. You'll see the login screen
3. Use default credentials:
   - **Admin:** username: `admin`, password: `admin123`
   - **User:** username: `nurse1`, password: `password123`

---

## Creating Windows Installer

### Prerequisites for Installer Build
- All dependencies installed
- Application built successfully
- ~500MB additional free space

### Build Installer

```bash
# From the main directory
npm run dist:win
```

### Build Process

The build will:
1. Compile the application
2. Package all dependencies
3. Create Windows installer
4. Generate portable version

**Expected Duration:** 2-5 minutes

### Output Location

```
unitview-windows/
└── release/
    ├── UnitView Setup 5.3.0.exe    # Installer
    └── win-unpacked/                # Portable version
```

### Installer Details

- **File Name:** `UnitView Setup 5.3.0.exe`
- **Size:** ~150-200MB
- **Type:** NSIS installer
- **Install Location:** `C:\Users\[Username]\AppData\Local\Programs\unitview-windows`

---

## Troubleshooting

### Build Errors

#### Error: "Cannot find module"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
cd renderer
rm -rf node_modules package-lock.json
npm install
cd ..
```

#### Error: "TypeScript compilation failed"
```bash
# Fix type errors for release builds.
# Temporary local fallback (not release-safe):
npm run build:renderer:fast
npm run build:main
```

#### Error: "ENOENT: no such file or directory"
```bash
# Solution: Ensure you're in the correct directory
pwd  # Should show: .../unitview-windows
```

### Runtime Errors

#### Blank White Screen
✅ **Fixed in v5.0.1** - If you still see this:
1. Open DevTools: `Ctrl+Shift+I`
2. Check Console for errors
3. Verify all files built correctly
4. Try rebuilding: `npm run build`

#### "Cannot find module 'electron'"
```bash
# Solution: Reinstall electron
npm install electron --save-dev
```

#### Database Errors
```bash
# Solution: Reset database
# Delete: %APPDATA%\unitview-windows\phi.vault.json
# Restart application
```

### Development Server Issues

#### Port 5173 already in use
```bash
# Solution: Kill the process or use different port
# Edit renderer/vite.config.ts and change port
```

#### Hot reload not working
```bash
# Solution: Restart dev server
cd renderer
npm run dev
```

### Installer Build Issues

#### Error: "wine not found"
This is expected on Windows - wine is only needed for Linux builds.

#### Error: "Application entry file not found"
```bash
# Solution: Build main process first
npm run build:main
npm run dist:win
```

---

## Advanced Configuration

### Custom Build Options

Edit `package.json` to customize:

```json
{
  "build": {
    "appId": "com.yourcompany.unitview",
    "productName": "UnitView",
    "directories": {
      "output": "release"
    },
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    }
  }
}
```

### Environment Variables

Create `.env` file in root:

```env
NODE_ENV=production
ELECTRON_ENABLE_LOGGING=true
```

### Debug Mode

Enable debug logging:

```bash
# Windows
set DEBUG=*
npm run electron

# Or in package.json
"electron": "cross-env DEBUG=* electron dist/main.js"
```

---

## Build Scripts Reference

### Main Process Scripts

```bash
npm run build:main      # Build main process
npm run dev:main        # Run main in dev mode
npm run electron        # Run built application
```

### Renderer Scripts

```bash
cd renderer
npm run dev             # Start dev server
npm run build           # Build with TypeScript
npm run build:no-check  # Build without TypeScript
npm run preview         # Preview built app
```

### Full Build Scripts

```bash
npm run build           # Release-safe build (renderer typecheck enforced)
npm run build:renderer:fast # Fast renderer build (no renderer typecheck)
npm run dist            # Build + create installer
npm run dist:win        # Build + create Windows installer
npm run pack            # Create unpacked directory
```

---

## Performance Tips

### Faster Builds
1. Use `npm run build:renderer:fast` for renderer-only local iteration
2. Close unnecessary applications
3. Use SSD for better I/O performance
4. Disable antivirus temporarily during build

### Smaller Bundle Size
1. Remove unused dependencies
2. Use production build
3. Enable minification
4. Tree-shake unused code

---

## Verification Checklist

Before considering build complete:

- [ ] `dist/main.js` exists
- [ ] `dist/preload.js` exists
- [ ] `renderer/dist/index.html` exists
- [ ] `renderer/dist/assets/` contains CSS and JS
- [ ] Application starts without errors
- [ ] Login screen appears
- [ ] Can log in with default credentials
- [ ] Dashboard loads correctly
- [ ] All features work as expected

---

## Getting Help

### Check These First
1. This BUILD_INSTRUCTIONS.md file
2. VERSION_5.0.1_RELEASE_NOTES.md
3. Console output for error messages
4. DevTools console (Ctrl+Shift+I)

### Common Solutions
- Reinstall dependencies
- Clear build cache
- Update Node.js
- Check file permissions
- Verify disk space

---

## Success!

If you've followed all steps and the application runs correctly, congratulations! 🎉

You now have a working UnitView v5.3.0 installation.

**Next Steps:**
- Customize the application for your needs
- Create your Windows installer
- Deploy to production
- Configure user accounts

---

**Build Date:** November 4, 2024  
**Version:** 5.3.0  
**Status:** Production Ready ✅