---
type: config
id: PROP-NUMBERING
updated: 2026-09-21
owner: PM-01 / TT-01
project: UnitView
---

# PROP numbering (TT → PM)

Imported from SoulCore.AI. Stops TT intake IDs from colliding with PM `TASK-###` execution counters.

## Format

| Kind | Form | Example |
| --- | --- | --- |
| Proposal (from TT) | `PROP-{N}-{subject}` | `PROP-1-shift-assignment-screen` |
| Split work item | `PROP-{N}.{M}` | `PROP-1.1`, `PROP-1.2` |
| Filename (proposal) | slug under `unexecuted_proposals/`; frontmatter **must** set `prop_id` | `shift-assignment-screen.md` |
| Filename (split task) | `PROP-{N}.{M}-PM01-to-{ROLE}.md` in `docs/agents/tasks/` | `PROP-1.1-PM01-to-FED01.md` |

- `{N}` = monotonic integer assigned at TT send-to-PM (or by PM on first accept if TT omitted it).
- `{M}` = split index starting at **1**. TINA may re-split / merge / reassign roles.
- Optional `PROP-{N}.0` = PM accept / routing note back to TT (not an execution seat).

## Rules

1. **TT never invents `TASK-###` for new idea intakes.** Use `PROP-N-subject`.
2. **PM owns division of labor.** Suggested `PROP-N.M` from TT are hints.
3. Legacy `TASK-{date}-{id}-…` files remain valid for pre-PROP UnitView work (through the 2026-06-20 sprint). Do not reuse those integers for new TT ideas.
4. Reports: `docs/agents/reports/PROP-{N}.{M}-{ROLE}-to-PM01.md`.
5. Unblock evals of an **existing** `TASK-*` may still return `TASK-*-TT01-to-PM01.md`, but any **new** proposal spawned from that eval gets a fresh `PROP-N`.

## Registry (UnitView)

| prop_id | Subject | Status | Splits |
| --- | --- | --- | --- |
| PROP-1-persistence-honesty | Fail-closed vault writes; docs honesty; no SQLite-now | **merged** — [PR #2](https://github.com/Linearthrone/Unitview_5.1.5c/pull/2) → `master` `11754bf` (2026-09-06) | 1.1–1.7 closed |
| PROP-2-in-memory-transitions | Kill hard reloads; delete leftover twins; remaining honesty docs | **merged** — [PR #4](https://github.com/Linearthrone/Unitview_5.1.5c/pull/4) → `master` `eddbbf9` (2026-09-21) | 2.1–2.5 closed |
| PROP-3-clinical-command-surface | Same-map clinical UI redesign; wall privacy + no idle-lock | **sent-to-pm** — intake `PROP-3-TT01-to-PM01.md` | suggested 3.1–3.5 (hold for approval) |
| PROP-4-progressive-view | Optional Progressive view (corridor templates/paint; glance map) after PROP-3 | **sent-to-pm** — intake `PROP-4-TT01-to-PM01.md` | suggested 4.1–4.7 (hold for approval; sequence after PROP-3) |

Next free `N`: **5**.

Historical UnitView sprint (closed): see `docs/agents/reports/TASK-20260620-004-PM01-SPRINT-COMPLETE.md`.
