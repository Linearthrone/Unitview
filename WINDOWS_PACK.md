# UnitView 5.4 — Windows pack

The production installer is **not stored in git**. `release/` is gitignored.

Packs published from **master** are stamped `5.4.<run>` (GitHub Actions run number) so each merge is a newer installer. The About box and Settings read that number from `app.getVersion()`.

## Where the installer is

### Installed workstation (after the first 5.4 pack)

1. **Help → Check for Updates…**, or **Settings → Check for updates**
2. If a newer master pack exists, download and install. Do **not** uninstall first. The vault stays in `%APPDATA%\unitview-windows`.

A 5.3.0-c (or older) install does not have this button. Install **one** 5.4 pack by hand, then use the button after that.

### GitHub Release (what the button reads)

Each successful **master** Windows pack publishes a GitHub Release (`UnitView-Setup-5.4.<n>.exe` plus `latest.yml`). That is the feed the installed app checks.

### GitHub Actions artifact

The **Windows pack** workflow still uploads the `.exe` as an artifact named `UnitView-Setup-5.4.<n>` (or `UnitView-Setup-5.4.0` on pull requests).

### Local Windows machine

```bat
npm install
npm run dist:win
```

Or double-click `build.bat`.

Electron-builder writes:

```
release\UnitView-Setup-5.4.0.exe
release\win-unpacked\UnitView.exe
```

That `.exe` is the NSIS installer. The unpacked folder is a portable run, not the installer.

This Linux/cloud VM cannot ship a Windows NSIS you can install at a nurses' station. Pack on Windows, take the Actions artifact, or wait for the master Release and use Check for updates.

## First login (this pack)

| Role | Username | First password |
| --- | --- | --- |
| Admin | `admin` | `password` |

If the account requires a password change, use **ChargeBoard26** (12+ characters, letter + number, not a common word). `admin123` is not a valid login.

## What this pack includes

- AES-256-GCM `phi.vault.json` (not SQLite)
- Command surface (PROP-3) and Progressive hallway view (PROP-4)
- In-app Windows update (GitHub Releases via electron-updater)
- About box and Settings read `app.getVersion()`

## Do not pack from

- Old zip names such as `unitview-v5.0.1-complete.zip`
- Leftover Visual Studio / SQL project folders (removed from this repo)
- `package_broken.json` (removed — that was the dead 4.0.5 file)

Live packager config is the `build` block in root `package.json` only.
