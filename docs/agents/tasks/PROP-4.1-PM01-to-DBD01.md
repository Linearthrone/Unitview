---
prop_id: PROP-4.1
from: PM-01
to: DBD-01
status: ready
---

# PROP-4.1 — PM-01 → DBD-01 (Progressive geometry)

**From:** TINA (PM-01)  
**To:** DBD-01  

## Do

Persist Progressive geometry **on the existing layout row**. Key room pins by patient/room id. No second patient table, no vault format change.

Shape: preferred mode (`command` \| `progressive`), template id, paint cells, room pins `{ patientId, row, col }` on a hallway canvas (not the 17×10 assignment grid).

Sanitize on read. Default preferred mode is Command. Empty paint/pins may be filled from the assignment grid at render time (hallway-enough auto layout).

## Do not

SQLite. Dual census. Blueprint blobs. Change `gridRow` / `gridColumn` meaning.

## Files (expected)

- `renderer/src/types/patient.ts` (`UnitLayoutMetadata`)
- `renderer/src/lib/progressive-view.ts` (new)
- `renderer/src/services/layoutService.ts`

## Done

A unit can save and reload Progressive geometry without cloning patients.
