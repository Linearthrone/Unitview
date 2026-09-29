# UnitView - Complete Version History

## [5.3.0] - 2026-09-27

### Deliverable
Windows installer for the current app: clinical navy shell, unit management sidebar, oncoming-shift draft, census bar, vault open fix, Electron 43.

Settings shows this version from the packaged app.

---

## [5.2.0-c] - 2026-06-20

### ✨ Features
- **UI overhaul** — bottom action bar (admit, staff, oncoming shift, zoom, leave unit), redesigned header
- **Census statistics** — bedded/available/blocked beds, anticipated discharges, nurse/PCT counts, max patients by staffing ratio
- **Patient clinical workflow** — separate notes vs pending procedures; 1013/2013 and sitter flags; transport-awaiting discharge flow
- **Clinical indicators** — HD/PD dialysis icons, transport icon for same-day EDD or awaiting pickup
- **Print layout designer v2** — landscape/portrait preview, style presets, uniform nurse assignment blocks
- **Oncoming shift** — Spectralink drag-to-staff, improved nurse card resize (assignments preserved)
- **PCT cards** — right-click context menu

### 🐛 Fixes
- Patient admit/update form (date coercion, gender select binding)
- Nurse card resize no longer hides assigned rooms
- Assignment print preview matches selected orientation

### 📦 Version
- Bumped from `5.1.5-c` to `5.2.0-c` (candidate build)
- Settings screen reads version from Electron `app.getVersion()`

---

## [5.0.1] - 2024-11-04

### 🐛 Critical Bug Fixes
- **FIXED:** Blank white screen issue that affected v4.0.5
- **FIXED:** Missing React imports in `use-undo-redo.tsx` causing "useEffect is not defined" error
- **FIXED:** Missing React imports in multiple component files
- **FIXED:** AuthContainer export issues
- **FIXED:** Package.json script quote encoding issues

### ✨ Improvements
- Added ErrorBoundary component for better error handling
- Improved App.tsx with loading states
- Enhanced error logging and debugging capabilities
- Cleaned up build artifacts and old packages
- Updated all documentation for v5.0.1

### 📦 Package Changes
- Version bumped to 5.0.1
- All dependencies verified and working
- Build process streamlined and tested
- Complete source code package with all fixes

### 🔧 Technical Changes
- All TSX files now properly import React
- Consistent error handling across components
- Improved TypeScript type safety
- Better code organization and structure

---

## [4.0.5] - 2024-10-31

### ❌ Known Issues
- Blank white screen on application launch
- Missing React imports in several components
- Build script quote encoding issues

### 🎯 Attempted Features
- UI improvements (doubled font sizes)
- Enhanced unit designation display
- Added "Leave Unit" button
- Room deletion via right-click
- Drag-and-drop fixes

**Note:** This version was not production-ready due to critical bugs.

---

## [4.0.4] - 2024-10-30

### ✅ Last Stable Version Before v5.0.1
- Complete authentication system
- Data persistence working
- Windows build functional
- All core features operational

---

## [4.0.0] - 2024-10-29

### 🎉 Major Release
- Complete rewrite as Electron desktop application
- Converted from web app to Windows desktop app
- Added local SQLite database
- Implemented authentication system
- Added admin and user dashboards
- Unit management with drag-and-drop
- Staff and patient management
- Assignment tracking

---

## [3.x] - Previous Web Version

### Features
- Web-based application
- Firebase backend
- Real-time updates
- Cloud storage

**Note:** Web version deprecated in favor of desktop application.

---

## Version Comparison

| Version | Status | Key Features | Issues |
|---------|--------|--------------|--------|
| 5.2.0-c | 🔄 Candidate | UI overhaul, census/staffing, print v2 | QA in progress |
| 5.0.1 | ✅ Stable | All fixes applied | None |
| 4.0.5 | ❌ Broken | UI improvements | Blank screen |
| 4.0.4 | ✅ Stable | Auth + persistence | None |
| 4.0.0 | ✅ Stable | Desktop app | None |
| 3.x | 🔄 Deprecated | Web app | N/A |

---

## Upgrade Path

### From v4.0.4 to v5.0.1
- Direct upgrade recommended
- No data migration needed
- All features preserved
- Improved stability

### From v4.0.5 to v5.0.1
- Clean install recommended
- Delete old installation
- Install v5.0.1 fresh
- Reconfigure settings

### From v3.x to v5.0.1
- Complete migration required
- Export data from web version
- Import into desktop version
- Reconfigure all settings

---

## Future Roadmap

### v5.1.0 (Planned)
- Enhanced UI improvements
- Additional reporting features
- Performance optimizations
- More customization options
- Export/import functionality

### v5.2.0 (Planned)
- Multi-unit support
- Advanced analytics
- Custom themes
- Plugin system

### v6.0.0 (Future)
- Cloud sync option
- Mobile companion app
- Advanced reporting
- AI-powered insights

---

**Current Version:** 5.3.0  
**Release Date:** November 4, 2024  
**Status:** Production Ready ✅