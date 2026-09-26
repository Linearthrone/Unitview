---
prop_id: PROP-3.3
from: PM-01
to: SEC-01
depends_on: none
siblings: PROP-3.1 (disjoint CSS)
status: ready
---

# PROP-3.3 — PM-01 → SEC-01 (wall identifiers + no idle-lock)

**From:** TINA (PM-01)  
**To:** SEC-01  
**Proposal:** PROP-3 Option A  

## Problem

`useSessionTimeout` in `auth-container.tsx` (~123–135) runs for **every** authenticated session, including `WALLDISPLAY`. Wall should stay up. Wall must hide **patient identifiers** (names) but keep clinical quick-reference (admit/EDD, safety marks). Name-alert strings that contain patient names stay off the wall. Print/export off for wall role. No PHI in new toasts/tooltips.

## Root cause

- Idle lock: `useSessionTimeout(authState.isAuthenticated, …)` with no `isWallDisplay` gate (`renderer/src/lib/session-timeout.ts`, `auth-container.tsx`).
- Identifier hiding exists in capabilities (`canSeePatientIdentifiers` in `roles.ts`) and `patient-block.tsx` `hideIdentifiers`, but wall print DOM, wallpaper snapshot, name-alert banner, and tooltips need a pass so names cannot leak.

## Do

- Disable idle warning + logout for `appRole === 'WALLDISPLAY'` only. Nurse/admin workstations still 15-minute idle lock.
- Hide person-identifying fields on wall surfaces (cards, header, wallpaper snapshot, any mounted print DOM, tooltips). Keep admit/EDD and safety marks.
- Do not disable auth. Clear PHI on explicit logout / switch-user.

## Do not

Vault rewrite. Epic JWT changes. Option B. Restyling cards (3.2 / 3.4). Writing exploit PoCs.

## Files (expected)

- `renderer/src/components/auth-container.tsx`
- `renderer/src/lib/session-timeout.ts` (only if the hook needs an enabled/role argument — prefer gating at the call site)
- `renderer/src/components/patient-block.tsx`
- `renderer/src/lib/wallpaper-snapshot.ts` / wallpaper view if names can appear
- Name-alert / print paths that wall can mount

## Done

WALLDISPLAY session does not idle-out. Patient names/identifiers are not visible on wall or in wall-mounted print/tooltip DOM. Clinical quick-ref remains. Workstation roles still idle-lock.
