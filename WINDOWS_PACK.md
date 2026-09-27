# UnitView 5.3.0-c — Windows pack

The production installer is **not stored in git**. `release/` is gitignored so old 4.x / 5.0.x / 5.1.5-c / 5.2.0-c builds cannot hide in the repo.

The filename **5.3.0-c** is the one to look for. Anything named 5.1.5-c or 5.2.0-c on disk is a previous pack.

## Where the installer is

On a **Windows** machine, from the repo root:

```bat
npm install
npm run dist:win
```

Or double-click `build.bat`.

Electron-builder writes:

```
release\UnitView-Setup-5.3.0-c.exe
release\win-unpacked\UnitView.exe
```

That `.exe` is the NSIS installer. The unpacked folder is a portable run, not the installer.

### From GitHub Actions

Open the **Windows pack** workflow on this repo. Download the artifact named `UnitView-Setup-5.3.0-c`. That is the same installer `npm run dist:win` produces.

This Linux/cloud VM cannot ship a Windows NSIS you can install at a nurses' station. Pack on Windows, or take the Actions artifact.

## First login (this pack)

| Role | Username | First password |
| --- | --- | --- |
| Admin | `admin` | `password` |

If the account requires a password change, use **ChargeBoard26** (12+ characters, letter + number, not a common word). `admin123` is not a valid login.

## What this pack includes

- AES-256-GCM `phi.vault.json` (not SQLite)
- Command surface (PROP-3) and Progressive hallway view (PROP-4 first wave)
- About box and Settings read `app.getVersion()` → **5.3.0-c**

## Do not pack from

- Old zip names such as `unitview-v5.0.1-complete.zip`
- Leftover Visual Studio / SQL project folders (removed from this repo)
- `package_broken.json` (removed — that was the dead 4.0.5 file)

Live packager config is the `build` block in root `package.json` only.
