# AGENTS.md

## Cursor Cloud notes — Unitview

Unitview is a Windows (also Electron) patient-management dashboard: React 18 + TypeScript renderer, Electron main process, AES-256-GCM `phi.vault.json` store, optional Epic FHIR census.

This `Agents/` pack was imported from [Linearthrone/SoulCore.AI](https://github.com/Linearthrone/SoulCore.AI) so the same TINA / FED / BED / DBD / SEC / QA / SLOP / TT seats can run here.

House Victoria (.NET Host, Avalonia desk, Unreal body) is a **different product**. Do not apply SoulCore Host/UE tickets to this repo.

### Product

| Field | Current |
| --- | --- |
| App | Unitview (version: root `package.json`; patch +1 on every commit) |
| Renderer | `renderer/` — React, Vite, Tailwind |
| Main | TypeScript Electron (`tsconfig.main.json` → `dist/main.js`) |
| Data | Workstation AES-256-GCM vault (`phi.vault.json`); localStorage first-run migrate only |
| FHIR | Optional Epic SMART Backend Services — `docs/HIPAA_AND_EPIC_FHIR.md` |
| QA smoke | `cd renderer && npm run qa:smoke` (Playwright) |

### Build / test (this VM)

```bash
npm install
cd renderer && npm install && cd ..
npm run build
npm test
cd renderer && npm run qa:smoke
```

Dev: `npm run dev` (renderer + main). Packager: `npm run dist:win` (Windows).

### Agent activation

| Need | File |
| --- | --- |
| Master control (TINA) | `@Agents/PM-01.md` |
| Roster | `@Agents/README.md` |
| Work standards | `@Agents/PM-01-Work-Standards.md` |

PM does not implement product features. Dispatch FED/BED/DBD/SEC/OPS/QA/SLOP/TT per `PM-01-EN.md` §8.4.

### Secrets

No tokens, Epic private keys, or passwords in git or tickets. Vault/key material stays on the workstation / env.
