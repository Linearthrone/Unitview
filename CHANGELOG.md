# UnitView version history

## [5.3.0-c] - 2026-09-27

### Pack
- New version number so Windows installers are distinguishable from leftover `5.1.5-c` and `5.2.0-c` setups
- Installer filename is now `UnitView-Setup-5.3.0-c.exe` (`release/`, gitignored)
- About box uses `app.getVersion()` instead of a hardcoded `5.1.5-c` string
- GitHub Actions **Windows pack** workflow uploads that `.exe` as an artifact

### Cleanup
- Removed dead 4.0.5 `package_broken.json`, v5.0.1 zip notes, v5.0.2 SQLite-era todo/status, Visual Studio `.vs/`, leftover `DB/` SQL project, and the empty `website/` pointer
- Live packager remains electron-builder NSIS in root `package.json`

### Product (already on master)
- PROP-3 Command surface (same-map restyle)
- PROP-4 Progressive hallway view (first wave)

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

Those files are gone from this repo. Pack **5.3.0-c** only.

**Current version:** 5.3.0-c
