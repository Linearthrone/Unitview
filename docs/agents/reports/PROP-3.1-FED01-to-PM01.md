# PROP-3.1 — FED-01 → PM-01

**Status:** Pass (local)  
**Ticket:** `PROP-3.1-PM01-to-FED01.md`

## Did

- Deleted `renderer/src/themes.css` (RGB overlay themes + global `* { transition: … !important }`).
- Stopped importing it from `main.tsx`.
- `applyAppTheme` / `normalizeAppTheme` in `renderer/src/lib/app-theme.ts`: only `light` | `dark`; maps stored blue/green/purple to light; toggles Tailwind `dark`.
- Dashboard + vault `global_theme` use that helper. Settings wrappers no longer add `theme-*` classes.
- `globals.css` input colors keyed off `.dark` / `html:not(.dark)`. Print still white / 10pt / `.print-hide`. `prefers-reduced-motion` honored.

## Evidence

`cd renderer && ./node_modules/.bin/tsc --noEmit` — exit 0.

## Not in this ticket

Card/census restyle (3.2). Wall idle (3.3, same wave, separate report).
