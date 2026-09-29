# UnitView v5.3.0 - Patient Management Dashboard

![Version](https://img.shields.io/badge/version-5.2.0--c-blue.svg)
![Status](https://img.shields.io/badge/status-stable-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🏥 Overview

UnitView is a comprehensive patient management dashboard designed for healthcare facilities. Built as a Windows desktop application using Electron and React, it provides real-time unit management, staff assignments, and patient tracking capabilities.

### Key Features

- 🔐 **Secure Authentication** - Admin and user role management
- 👥 **Staff Management** - Track nurses, charge nurses, and support staff
- 🏥 **Patient Management** - Comprehensive patient information and assignments
- 📊 **Unit Dashboard** - Visual unit layout with drag-and-drop assignments
- 💾 **Encrypted local vault** - AES-256-GCM `phi.vault.json` on the workstation (not SQLite)
- 🖥️ **Desktop Application** - Native Windows application with offline capability
- 🗺️ **Live desktop map** - Pin the active unit map to the Windows wallpaper (PHI redacted by default)
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites
- Windows 10/11 (64-bit)
- Node.js 18.x or 20.x

### Installation

1. **Extract the package**
2. **Install dependencies:**
   ```bash
   npm install
   cd renderer && npm install && cd ..
   ```
3. **Build the application:**
   ```bash
   cd renderer && npm run build:no-check && cd ..
   npm run build:main
   ```
4. **Run the application:**
   ```bash
   npm run electron
   ```
   For development (renderer + main watch):
   ```bash
   npm run dev
   ```

### Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**User Account:**
- Username: `nurse1`
- Password: `password123`

⚠️ **Change these credentials after first login!**

---

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Build Instructions](BUILD_INSTRUCTIONS.md)** - Complete build guide
- **[Release Notes](VERSION_5.0.1_RELEASE_NOTES.md)** - Historical v5.0.1 notes
- **[Changelog](CHANGELOG.md)** - Complete version history
- **[Agent roster (TINA / PM-01)](Agents/README.md)** - SoulCore.AI seats imported for this repo

---

## 🎯 Features in Detail

### Authentication System
- Secure login with username/password
- Role-based access control (Admin/User)
- Session management
- Automatic logout on window close

### Admin Dashboard
- Create and manage units
- Add/edit/delete staff members
- Add/edit/delete patients
- View system-wide statistics
- User management

### User Dashboard
- Select and enter assigned units
- View unit layout and assignments
- Manage patient assignments
- Track staff assignments
- Real-time updates

### Unit Management
- Visual unit layout with room grid
- Drag-and-drop staff assignments
- Patient admission and discharge
- Room designation management
- Assignment history tracking

### Data Management
- Encrypted whole-document vault (`%APPDATA%\unitview-windows\phi.vault.json`)
- Automatic data persistence via main-process IPC
- Backup and restore (File → Export / Import)
- Fail-closed load: a vault that will not decrypt is left untouched

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

### Backend
- **Electron** - Desktop framework
- **Node.js** - Runtime
- **AES-256-GCM vault** - Encrypted workstation store (`src/ipc/secure-vault.ts`)
- **electron-store** - Non-PHI Epic public settings only

### Build Tools
- **TypeScript Compiler** - Type checking
- **Electron Builder** - Packaging
- **Vite** - Frontend bundling

---

## 📁 Project Structure

```
unitview-windows/
├── main.ts                    # Electron main process
├── preload.ts                 # Preload script for IPC
├── package.json              # Main dependencies
├── tsconfig.json             # TypeScript config
├── renderer/                 # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── main.tsx          # React entry point
│   │   ├── components/       # React components
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── user-dashboard.tsx
│   │   │   ├── auth-container.tsx
│   │   │   ├── unit-view-client.tsx
│   │   │   └── ...
│   │   ├── services/         # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── database-simple.ts
│   │   │   └── ...
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── use-undo-redo.tsx
│   │   └── types/            # TypeScript types
│   ├── package.json          # Renderer dependencies
│   └── vite.config.ts        # Vite configuration
├── dist/                     # Built main process
├── release/                  # Built installers
└── Documentation/            # Additional docs
```

---

## 🔧 Development

### Development Mode

**Option 1: Using npm scripts**
```bash
npm run dev
```

**Option 2: Manual start**
```bash
# Terminal 1 - Renderer
cd renderer && npm run dev

# Terminal 2 - Main process
npm run dev:main
```

### Building

```bash
# Build everything
npm run build

# Build renderer only
cd renderer && npm run build:no-check

# Build main process only
npm run build:main
```

### Creating Installer

```bash
# Create Windows installer
npm run dist:win
```

Output: `release/UnitView Setup 5.3.0.exe` (exact filename follows `package.json` version)

---

## 🐛 Troubleshooting

### Blank White Screen
✅ **Fixed in v5.0.1** - All React import issues resolved

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
cd renderer
rm -rf node_modules package-lock.json
npm install
cd ..
npm run build
```

### Vault Issues
If the encrypted store will not open, UnitView returns to the login screen and **does not** overwrite the file. To reset a workstation (destroys local unit data):
```
%APPDATA%\unitview-windows\phi.vault.json
```

### Console Errors
Press `Ctrl+Shift+I` to open DevTools and check console

---

## 📊 System Requirements

### Minimum
- Windows 10 (64-bit)
- 4GB RAM
- 500MB free disk space
- 1280x720 display

### Recommended
- Windows 11 (64-bit)
- 8GB RAM
- 1GB free disk space
- 1920x1080 display

---

## 🔒 Security

See [docs/HIPAA_AND_EPIC_FHIR.md](docs/HIPAA_AND_EPIC_FHIR.md) for Epic SMART Backend Services setup, encrypted storage, audit logging, and the organizational steps still required for HIPAA.

### Data Storage
- Encrypted AES-256-GCM vault on the workstation (`%APPDATA%\unitview\`)
- Optional Epic FHIR census over HTTPS
- Audit log of access events (no names or MRNs)

### Authentication
- Passwords stored securely
- Session-based authentication
- Automatic logout on close
- Role-based access control

### Best Practices
- Change default passwords immediately
- Regular vault / export backups
- Keep application updated
- Restrict physical access to workstations

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Credits

**Developed by:** Linearthrone  
**Version:** 5.3.0  
**Release Date:** September 27, 2026

---

## 🤝 Contributing

This is a private project. For feature requests or bug reports, please contact the development team.

---

## 📞 Support

### Documentation
- Check included documentation files
- Review console logs for errors
- Verify system requirements

### Common Issues
- Ensure Node.js 18+ is installed
- Verify all dependencies are installed
- Check disk space availability
- Review build logs for errors

---

## What's New in v5.3.0

See [CHANGELOG.md](CHANGELOG.md) for the full list. Highlights:

- Bottom action bar and census/statistics panel
- Patient 1013/sitter flags, transport workflow, HD/PD indicators
- Print layout designer v2 with landscape preview
- Oncoming shift and Spectralink improvements
- Live store is the encrypted vault (not SQLite); decrypt failure returns to login without writing defaults

### Historical — v5.0.1

### Critical Fixes
✅ Resolved blank white screen issue  
✅ Fixed all React import errors  
✅ Added comprehensive error handling  
✅ Improved build reliability  

### Improvements
✨ Enhanced error boundaries  
✨ Better loading states  
✨ Improved debugging capabilities  
✨ Streamlined build process  

---

## 🚀 Getting Started

1. **Read** [QUICK_START.md](QUICK_START.md) for fastest setup
2. **Follow** [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed guide
3. **Review** [CHANGELOG.md](CHANGELOG.md) for version history
4. **Check** [CHANGELOG.md](CHANGELOG.md) for version history

---

## ✅ Production Ready

UnitView v5.3.0 is the current Windows package: clinical shell, oncoming-shift draft, census bar, and the encrypted store fix.

**Enjoy using UnitView!** 🏥

---

**Last Updated:** 2026-09-06  
**Version:** 5.3.0  
**Status:** Active development (UI overhaul + PROP-1 persistence honesty)
