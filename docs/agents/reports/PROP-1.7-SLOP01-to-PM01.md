# PROP-1.7 — SLOP-01 → PM-01

**Status:** done (read-only)

## Scope

Diffs for PROP-1.1–1.5 (vault IPC, `database-simple`, services, App/login, autosave, honesty docs).

## Findings

- No second store introduced. No `better-sqlite3`.
- `initializeWithDefaults` catch-write path is gone; first-run write happens only after `storeStatus === 'available'`.
- Autosave no longer fans out four full-document IPC saves.
- Historical 5.0.1 / SQLite mentions remain in `CHANGELOG.md`, `VERSION_5.0.1_RELEASE_NOTES.md`, `QUICK_START.md`, `PACKAGE_CONTENTS.md` — those were **not** in the PROP-1.5 live-claim list. Flag only if LinearThrone wants a docs sweep later.
- `database-simple.ts` still uses `any[]` on `action_history` (pre-existing).
- Renderer `tsconfig` exclude for `vault-init.test.ts` is correct (Node test APIs).

## Verdict

No slop that blocks PROP-1 close. Optional later: QUICK_START / changelog honesty sweep.
