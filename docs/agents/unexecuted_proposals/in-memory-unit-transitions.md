---
type: proposal
status: merged
tt_id: TT-01
prop_id: PROP-2-in-memory-transitions
created: 2026-09-21
updated: 2026-09-21
title: In-memory unit transitions after persist honesty
need: Stop hard-reloading the Electron window after save-as / create-unit / import now that the vault persist contract exists
pm_tickets:
  - docs/agents/tasks/PROP-2.1-PM01-to-FED01.md
  - docs/agents/tasks/PROP-2.2-PM01-to-FED01.md
  - docs/agents/tasks/PROP-2.3-PM01-to-FED01.md
---

# In-memory unit transitions

Parked on PROP-1 as D7. Persist honesty is merged. `window.location.href = '/'` is a Next leftover — this app is Electron + Vite, not SSR.

## Route

Replace the four hard reloads with `loadLayoutIntoView`. Make `availableLayouts` stateful. Delete unimported leftover twins. Fix remaining live-claim docs (`QUICK_START` still says `npm start`).

Out of scope: SQLite, FHIR N+1, splitting `UnitViewClient`.
