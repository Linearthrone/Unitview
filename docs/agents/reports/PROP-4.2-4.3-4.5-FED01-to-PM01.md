# PROP-4.2 / 4.3 / 4.5 — FED-01 → PM-01

**Status:** Pass (local)  
**Tickets:** admin setup, workstation, view picker

## Did

- Admin **Admin → Progressive hallway setup**: templates (straight / L / U / T / racetrack), paint cells, pin rooms, save and switch.
- Admin **Admin → Command surface / Progressive view** picker. Default remains Command. Setting is stored on the unit.
- Progressive workstation: assignable nurse columns + glance-only hallway map. Column chips keep `[data-patient-id]`. Map clicks open the existing report. No drag on the map.
- Empty geometry auto-builds a racetrack from the assignment grid so an existing unit can be switched immediately.

## Evidence

`cd renderer && ./node_modules/.bin/tsc --noEmit` — exit 0.

## Not in this wave

Print restyle. Full wall chrome polish (4.4 first cut uses the same glance map with identifiers off). QA Pass (4.7).
