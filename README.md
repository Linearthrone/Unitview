# UnitView 5.3.0-c

Charge-nurse unit map and assignment dashboard. Electron + React. Local-first AES-256-GCM vault. Optional Epic FHIR census.

![Version](https://img.shields.io/badge/version-5.3.0--c-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)

## Windows installer

The installer is **not in this repo**. Pack it on Windows (or download the GitHub Actions artifact). See **[WINDOWS_PACK.md](WINDOWS_PACK.md)**.

```bat
npm install
npm run dist:win
```

Look for `release\UnitView-Setup-5.3.0-c.exe`. Older `5.1.5-c` / `5.2.0-c` setup files on disk are previous packs.

## Dev

```bash
npm install
npm run dev
```

Production-like local run after compile:

```bash
npm run build
npm run electron
```

### First login

- Username: `admin`
- Password: `password`
- If asked to change password: `ChargeBoard26`

`admin123` is not a valid login.

## What this pack is

- Encrypted workstation vault (`%APPDATA%\unitview-windows\phi.vault.json`) — not SQLite
- Command surface (PROP-3) and Progressive hallway view (PROP-4 first wave)
- About and Settings show **5.3.0-c** from `app.getVersion()`

## Docs

- **[WINDOWS_PACK.md](WINDOWS_PACK.md)** — where the installer is and how to build it
- **[QUICK_START.md](QUICK_START.md)** — short run path
- **[CHANGELOG.md](CHANGELOG.md)** — version history
- **[docs/HIPAA_AND_EPIC_FHIR.md](docs/HIPAA_AND_EPIC_FHIR.md)** — Epic SMART + vault
- **[Agents/README.md](Agents/README.md)** — TINA / PM-01 roster

## Stack

| Layer | Path |
| --- | --- |
| Electron main | `src/` → `dist/main.js` |
| Renderer | `renderer/` (Vite + React 18) |
| Vault IPC | `src/ipc/secure-vault.ts` |
| Packager | `package.json` `build` (electron-builder NSIS → `release/`) |

Decrypt failure returns to login and does not overwrite the vault.

**Owner:** LinearThrone / linearthrone.com
