---
prop_id: PROP-3.2
from: PM-01
to: FED-01
depends_on: PROP-3.1
status: blocked-on-3.1
---

# PROP-3.2 — PM-01 → FED-01 (same-grid expression)

**From:** TINA (PM-01)  
**To:** FED-01  
**Proposal:** PROP-3 Option A  
**Target look:** `docs/agents/unexecuted_proposals/mockups/clinical-command-surface/mockup-02b-option-a-same-map-workstation.png` (concept, not pixel-perfect)

## Problem

Occupied-and-assigned rooms fade (~70% opacity). Safety marks are often icon-only with a tooltip (hence the Icons dialog). Header census is equal bordered chips. Isolation subtypes can share one accent. Color is too close to the only channel.

## Do

On the **existing** room map (do not change `gridRow` / `gridColumn` semantics or smoke selectors):

- Assigned occupied rooms: **full contrast** + a settled mark. Stop opacity-as-done.
- Safety: **shape + short text** for isolation subtype (contact / airborne / droplet distinct), fall risk, DNR, restraints, name alerts. No hover-only, no color-only.
- Group census in the header; facility branding leads; UnitView is the tool name.
- Preserve `[data-patient-id]` drag, Print → Charge report, oncoming-shift control, login labels.

## Do not

Option B / nurse-column + floorplan. New layout authoring. Split `UnitViewClient`. Glass, blur, gradient washes, patient photos, pulsing alerts. Body type below 18px.

## Files (expected)

- `renderer/src/components/patient-block.tsx`
- `renderer/src/components/app-header.tsx`
- Related card/census helpers under `renderer/src/components/` and `renderer/src/lib/`

## Done

Charge nurse can safety-glance without opening Icons. Assigned rooms are not the dimmest cells. Playwright smoke still signs in, enters a unit, opens charge report, and drags `[data-patient-id]`.
