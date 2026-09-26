---
prop_id: PROP-3.1
from: PM-01
to: FED-01
depends_on: none
siblings: PROP-3.3 (disjoint — SEC wall idle/identifiers)
status: ready
---

# PROP-3.1 — PM-01 → FED-01 (token foundation)

**From:** TINA (PM-01)  
**To:** FED-01  
**Proposal:** PROP-3 Option A  
**Product root:** `/workspace`

## Problem

Two theme systems fight. `renderer/src/globals.css` holds shadcn HSL tokens (including `.dark`). `renderer/src/themes.css` overlays RGB `theme-light|dark|blue|green|purple` and applies `* { transition: … !important }` on every node. The unit board often never gets Tailwind `dark`, so `dark:` utilities and `themes.css` disagree. That is a large part of the dated look.

## Root cause

- `renderer/src/main.tsx` imports `themes.css` after globals.
- `themes.css` lines 137–140: global `!important` color transitions (kill criterion).
- `SimpleDatabase.setGlobalTheme` / `applyTheme` still type and apply five `theme-*` classes (`database-simple.ts` ~244–264).
- Settings UI already says extra themes are deprecated (`user-dashboard-settings.tsx`) but the store type is still five values.

## Do

- One token source in `globals.css`: light (`:root`) + clinical-dark (`.dark`). Keep Arial 18px. Print stays white / ~10pt / `.print-hide`.
- Remove the global `* { transition: … !important }` rule. Honor `prefers-reduced-motion`.
- Stop applying `theme-blue` / `theme-green` / `theme-purple`. Map stored `blue|green|purple` to `light` on read. Apply Tailwind `dark` when clinical-dark is on so `dark:` utilities match.
- Settings remain light / clinical-dark only. No third token file.

## Do not

Vault rewrite. SQLite. Split `unit-view-client.tsx`. Option B floorplan. Font CDNs, glass, pulsing alerts. Card/census restyle (that is **3.2**).

## Files

- `renderer/src/globals.css`
- `renderer/src/themes.css` (empty, delete, or stop importing)
- `renderer/src/main.tsx`
- `renderer/src/lib/database-simple.ts` (`global_theme`)
- `renderer/src/components/user-dashboard.tsx` (`applyTheme`)
- `renderer/src/components/user-dashboard-settings.tsx` if class names still need `dark`

## Done

Light + clinical-dark render from one token set. No global `!important` color transition. Extra theme classes gone. `npm run build:renderer` still passes `tsc`.
