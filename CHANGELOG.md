# Unitview version history

## [5.4.1] - 2026-09-30

### Pack
- Product and git name is **Unitview** (GitHub repo `Linearthrone/Unitview`)
- Every commit increments the patch in `package.json` (git hook). Installer and About use that number
- Master packs no longer overwrite the patch with a GitHub Actions run number

---

## [5.4.0] - 2026-09-29

### Pack
- Installed Windows clients can **Check for updates** (Help menu or Settings) and install over the existing app
- Master Windows pack published a GitHub Release stamped `5.4.<run>` (replaced in 5.4.1 by per-commit patch)
- First 5.4 installer is still a one-time install for 5.3.0-c workstations; after that, do not uninstall to take a new pack

### Product (already on master)
- PROP-3 Command surface, PROP-4 Progressive hallway segments, compact board stats

---

## [5.3.0-c] - 2026-09-27

### Pack
- New version number so Windows installers are distinguishable from leftover `5.1.5-c` and `5.2.0-c` setups
- Installer filename is now `Unitview-Setup-5.3.0-c.exe` (`release/`, gitignored)
- About box uses `app.getVersion()` instead of a hardcoded `5.1.5-c` string
- GitHub Actions **Windows pack** workflow uploads that `.exe` as an artifact

### Cleanup
- Removed dead 4.0.5 `package_broken.json`, v5.0.1 zip notes, v5.0.2 SQLite-era todo/status, Visual Studio `.vs/`, leftover `DB/` SQL project, and the empty `website/` pointer
- Live packager remains electron-builder NSIS in root `package.json`

### Product (already on master)
- PROP-3 Command surface (same-map restyle)
- PROP-4 Progressive hallway view (first wave)

---

## [5.3.0] - 2026-09-27

### Deliverable
Windows installer for the current app: clinical navy shell, unit management sidebar, oncoming-shift draft, census bar, vault open fix, Electron 43.

Settings shows this version from the packaged app.

---

## [5.2.0-c] - 2026-06-20

- Bottom action bar, census statistics, clinical flags, print layout v2, oncoming shift
- Vault store (not SQLite); settings read `app.getVersion()`
- Candidate build superseded by 5.3.0-c

---

## Retired packs (do not build)

| Version | Why retired |
| --- | --- |
| 5.1.5-c | Previous product line; About box still said this after 5.2.0-c |
| 5.0.2 / 5.0.1 | Zip-era docs; SQLite / `admin123` claims |
| 4.0.5 | Broken `package.json` quotes; blank screen |
| 4.0.x / 3.x | Desktop rewrite / deprecated web |

Those files are gone from this repo. Pack from current `package.json` only.

**Current version:** root `package.json` (patch +1 on every commit)
