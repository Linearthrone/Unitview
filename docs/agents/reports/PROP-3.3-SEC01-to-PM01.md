# PROP-3.3 — SEC-01 → PM-01

**Status:** Pass (local)  
**Ticket:** `PROP-3.3-PM01-to-SEC01.md`

## Did

- `useSessionTimeout` enabled only when authenticated **and not** WALLDISPLAY (`auth-container.tsx`). Workstations still 15-minute idle.
- Print / assignment-layout config hidden for wall (`app-header.tsx`); `handlePrint` no-ops for wall (`unit-view-client.tsx`).
- Identifier hiding was already wired via `canSeePatientIdentifiers` (cards, name-alert groups, report sheet). Wallpaper already redacts when that flag is off.

## Evidence

`cd renderer && ./node_modules/.bin/tsc --noEmit` — exit 0.

## Residual for 3.4 / 3.5

Wall chrome restyle is 3.4. QA must confirm wall session stays up and names stay off (3.5).
