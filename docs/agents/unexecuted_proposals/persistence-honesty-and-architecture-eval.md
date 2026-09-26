---
type: proposal
status: merged
tt_id: TT-01
prop_id: PROP-1-persistence-honesty
created: 2026-09-05
updated: 2026-09-06
title: Persistence honesty — fail-closed vault writes before any SQLite rewrite
need: Stop silent empty-unit / lost-update / README-SQLite contradiction without a mid-station storage rewrite
sent_at: 2026-09-05
pm_intake: docs/agents/tasks/PROP-1-TT01-to-PM01.md
source_eval: architecture review 2026-09-05 (Good-to-Great / Needs Attention / Reorg / Better-if)
source_ticket: docs/agents/tasks/TASK-20260905-001-PM01-to-TT01.md
---

# Persistence honesty — fail-closed vault writes before any SQLite rewrite

## 1. Need / Want

LinearThrone sent a full architecture review. The thinktank must turn it into **one executable first path**, not a wipeout of every Better-if.

Charge nurses need the unit map, assignments, prints, and shift board to keep working. The live store must stop looking like an empty unit when the vault fails, and must stop fire-and-forget whole-document writes that can lose or overwrite PHI.

## 2. Goal & Success Criteria

- Vault load failure **does not** seed vacant rooms or write defaults over `phi.vault.json`.
- Every persist **awaits** main-process `saveSecureStore`, is serialized (no overlapping last-write-wins), and uses an atomic replace.
- Store errors surface as a blocking / honest UI — not `[]` or a seeded North-South floor.
- Docs/About/DBD-01 describe the **actual** store (encrypted whole-document vault), not SQLite/`unitview.db`.
- Good-to-Great stays invariant: `sandbox` / `contextIsolation` / `nodeIntegration: false`; Epic PEM in main; domain services; FHIR mapper tests; audit/crypto modules.
- Explicitly **out of scope for PROP-1:** main-process SQLite, `UnitViewClient` split, FHIR batch rewrite, merging leftover `src/*.tsx` over live `components/`, `ui/` primitive merge, Vercel.

LinearThrone-facing success: the board does not flash-empty or silently “save” a ghost unit.

## 3. Context & Constraints

Thinktank seats: STRAT, CONTRA, SYS, RISK, USER (2026-09-05). Claims verified against the tree.

| Fact | Where |
| --- | --- |
| Live store is AES-256-GCM `phi.vault.json` via IPC, not SQLite | `database-simple.ts`, `src/ipc/secure-vault.ts` |
| No `better-sqlite3` in either `package.json` | root + `renderer/package.json` |
| `saveToLocalStorage` fire-and-forgets `saveSecureStore` | `database-simple.ts` ~164–178 |
| `getPatients` seeds / returns `[]` on failure | `patientService.ts:13–33` |
| Layout/nurse reads swallow to fallback/`[]` | `layoutService.ts`, `nurseService.ts` |
| Autosave can fan out four full-document writes | `unit-view-client.tsx` (~1146–1222) |
| `database-auth.ts` / `App-auth.tsx` unimported leftovers | tsconfig exclude; `main.tsx` → `App.tsx` only |
| Review claim that live client imports excluded root files | **False** — imports are `components/` siblings |
| Hard reload after save-as / unit switch / import | `window.location.href = '/'` |
| HIPAA SoT already describes the vault | `docs/HIPAA_AND_EPIC_FHIR.md` |
| Renderer still holds the full decrypted working set | accepted for this product unless LinearThrone hard-rules otherwise |

## 4. Clarifying Q&A (answered)

| Q | Locked default (TT synthesis) | Revisit if |
| --- | --- | --- |
| First engine | **Keep vault**; serialize + fail-closed | LinearThrone mandates SQLite this program |
| Load failure | **Fail closed** — block UI, keep ciphertext | LinearThrone prefers board-always-opens |
| Seed vacant rooms | First-run only, never `catch` / empty-read | — |
| SQLite in wave 1 | **No** | Q1 below is Yes |
| Split `UnitViewClient` in wave 1 | **No** | After persist honesty + LinearThrone approve |
| FHIR N+1 in wave 1 | **No** unless floor already rate-limited | Q2 |

## 5. Avenues Explored

### Avenue A — Honest vault + serialize + fail loud (MVP) — **recommended**

Keep `phi.vault.json`. Queue/await/coalesce vault writes; atomic replace; fail-closed load; stop seed-on-read; typed/loud errors at UI; docs honesty; quarantine fossils **after** persist tests (delete-only, do not merge leftover trees onto live).

- **Pros:** Fixes the kill-level PHI paths; no native addon; matches HIPAA SoT; seats unanimous on sequencing.
- **Cons:** Renderer still owns the working-set blob; no SQL transactions.

### Avenue B — Main-process SQLite now

`better-sqlite3` in main, typed IPC, migrate vault → tables, keep services as a facade.

- **Pros:** Matches README; real transactions; can become renderer-not-durable-owner later.
- **Cons:** Native Electron 39 packaging; new encrypt-at-rest story (unencrypted `.db` is a HIPAA regression); does **not** fix seed-on-failure by itself; high station blast radius.

### Avenue C — Safety hotfix only

Write queue + fail-loud + README. No fossil purge.

- **Pros:** Smallest ticket.
- **Cons:** Residue stays; weaker “one SoT” story.

## 6. Recommended Route

**Avenue A (PROP-1).** Do not start Avenue B until LinearThrone answers Q1 and PROP-1 persist tests exist.

Protect G2G. Do not rewrite storage and decompose UI in the same wave.

## 7. Alternatives (parked)

| Item | Why parked |
| --- | --- |
| Main-process SQLite (C1 / Avenue B) | Optional wave 2 after honesty + encrypted-DB design |
| Collapse leftover `src/*.tsx` / `src/ui` as a persist project | Hygiene; delete-only after import-graph proof |
| Split `UnitViewClient` (C5) | Persist orchestrator today; split after one persist API with ack |
| FHIR batch / bounded concurrency (B6, D4) | Isolated; later unless Epic is live-slow |
| Indexed census maps (B7, D8) | Fine at ~40 beds |
| Hard-reload → in-memory transitions (D7) | UX wave after persist honesty |
| `useAutosave` / `action_history` unify (D6, D9) | Hook unused; history untyped unused by UI |
| Vercel GitHub fail | Electron vs web host — not this program |

## 8. Risks & Kill Criteria

| Route | Stop when |
| --- | --- |
| PROP-1 | Any change seeds or writes the vault on decrypt/load failure; sandbox/`contextIsolation` weakened |
| SQLite-now | Packaging becomes the critical path; `.db` would be unencrypted; only rationale is README |
| Tree collapse | PR mixes persist + mass delete; cannot prove live vs dead |
| Client split | Autosave still `void` / unserialized; persist contract unwritten |

**RISK:** each workstation holds its own vault. A bad updater + leftover seed path can wipe **that floor**. Backup before any later format change.

## 9. Open Questions for User / PM

**Locked 2026-09-05 (LinearThrone):**

1. **Destination store:** Encrypted vault stays 5.x SoT. No SQLite this program.
2. **Live Epic:** Still sandbox fixtures. FHIR N+1 stays parked.
3. **Decrypt failure:** Return to the **main / login screen** with a banner. Do **not** overwrite the vault. Do **not** seed vacant rooms. Not a full-page fatal trap.

(Non-blocking later: leftover `todo.md` shift-assignment *page* vs current oncoming + prints.)

## 10. Suggested PM Handoff

- `prop_id`: **PROP-1-persistence-honesty**
- Suggested splits (TINA may re-divide; **do not ticket until LinearThrone approves**):

| Split | Role | One-line |
| --- | --- | --- |
| PROP-1.1 | BED-01 + DBD-01 | Fail-closed `initialize()`: existing vault decrypt/parse fail → no defaults, no `saveVault`, no seed |
| PROP-1.2 | BED-01 | Serialize + await `saveSecureStore`; atomic temp+rename in `saveVault`; coalesce latest `this.data` |
| PROP-1.3 | FED-01 | Stop seed/`[]` on store error in patient/layout/nurse reads; blocking “store unavailable” UI; `savePatients` must not swallow |
| PROP-1.4 | FED-01 | Coalesce board autosave to one persist (stop 4× full-document writes per change) |
| PROP-1.5 | FED-01 (docs) | README / INSTALLATION / About / DBD-01: encrypted vault, not SQLite/`npm start`/`5.0.1` |
| PROP-1.6 | QA-01 | Persist regression: fail-closed load, write-ack, no seed-on-error, no overlapping last-write wipe |
| PROP-1.7 | SLOP-01 | Post-QA slop on changed persist/UI paths |

Optional later (not this PROP): quarantine `database-auth.ts`, `App-auth.tsx`, excluded root twins, debug/backup files — **delete-only**.

What PM should decide first after LinearThrone approval: accept Avenue A; hold Avenue B; issue 1.1→1.2 sequential (same files), then 1.3+1.4 parallel if paths stay disjoint, then 1.5, then QA→SLOP.
