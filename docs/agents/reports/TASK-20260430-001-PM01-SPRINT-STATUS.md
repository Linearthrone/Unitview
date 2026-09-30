---
type: report
from: PM-01
to: ALL
status: Active Sprint Snapshot
date: 2026-04-30
version: 5.1.5-c
---

# Unitview Sprint Status — 2026-04-30

## Build health

| Check | Result |
|-------|--------|
| `cd renderer && npx tsc --noEmit` | PASS |
| `npm run build` (root) | PASS |
| App version | `5.1.5-c` (root + renderer aligned) |

## Completed and archived (DEV)

| Task | Deliverable |
|------|-------------|
| 011 | Unit isolation, right-column drag, duplicate room fix |
| 017 | QA smoke harness (`renderer`: `npm run qa:smoke`) |
| 018 | Unit map mouse-wheel zoom (70–150%, reset control) |
| 020 | Patient details "Edit / Add Patient Information" button |

## Open user-facing work

| Priority | Area | Task | Owner |
|----------|------|------|-------|
| P0 | QA validation | 012 — unit isolation / drag / duplicate room | QA-01 |
| P0 | QA re-run | 007 — stabilization smoke (use harness from 017) | QA-01 |
| P1 | Feature | 022 — print pipeline fix + shift print layout GUI | DEV-01 |
| P1 | UX | 013 — full UI redesign + clinical dark theme | DEV-01 |
| P2 | QA | 019, 021, 023 — after upstream DEV/QA gates | QA-01 |

## Known gaps

1. **Printing** — brittle `window.open` pipeline; hardcoded assignment layout; no user configurator (ISSUE-005).
2. **QA backlog** — 007 was NOT READY due to missing UI evidence; harness now exists but 007 must be re-run.
3. **UI redesign** — approved direction (full redesign, clinical dark, neutral professional) not yet implemented.
4. **Uncommitted code** — local changes in `app-header`, `patient-grid`, `unit-view-client`, `name-alerts` not yet committed.

## Sprint execution order (effective now)

### DEV-01 (parallel tracks OK)

1. **TASK-20260422-022** — print fix + layout GUI (user priority)
2. **TASK-20260422-013** — UI redesign (after or alongside 022; avoid conflicting edits in same files)

### QA-01 (strict single-thread)

1. **TASK-20260422-012** — validate P0 unit fixes (ACTIVE)
2. **TASK-20260421-007** — re-run with `npm run qa:smoke` + manual supplement
3. **TASK-20260422-019** — zoom validation (after 012)
4. **TASK-20260422-021** — edit button validation (after 019)
5. **TASK-20260422-023** — print validation (after 022)

## PM next actions

- Enforce queue discipline via `TASK-20260430-002` control directive.
- Unblock QA on 012 immediately.
- Keep 013/022 as active DEV lanes.
- Review QA reports before activating next QA tickets.
