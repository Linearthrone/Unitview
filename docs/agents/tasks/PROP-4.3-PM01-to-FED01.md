---
prop_id: PROP-4.3
from: PM-01
to: FED-01
depends_on: PROP-4.1
status: ready
---

# PROP-4.3 — PM-01 → FED-01 (Progressive workstation)

**Target look:** `docs/agents/unexecuted_proposals/mockups/progressive-view/review-p3-progressive-workstation.png` (concept)

## Do

Nurse **columns** (assignable — same drop handlers as Command surface) plus a **glance-only** hallway map (room number + safety marks; click opens the existing report). Unassigned occupied rooms get a pool column.

Preserve `[data-patient-id]` on column chips. No drag on the map.

## Do not

Second patient list. Drag-on-map. Split `unit-view-client.tsx`. Glass, pulse, photos.

## Done

Charge can assign from columns and safety-glance the map without leaving Progressive.
