---
type: proposal-intake
prop_id: PROP-4
prop_full: PROP-4-progressive-view
from: TT-01
to: PM-01
priority: P1
status: Intake — waiting LinearThrone approval before TINA tickets
created: 2026-09-21
sent_at: 2026-09-21
mode: idea
title: Progressive view — corridor map + cards after PROP-3
proposal: docs/agents/unexecuted_proposals/progressive-view.md
assignee_role: PM-01 (TINA)
depends_on: PROP-3-clinical-command-surface
---

# PROP-4 : Progressive view (TT-01 → TINA / PM-01)

**For:** PM-01 (TINA). **From:** TT-01. **Mode:** `idea`.  
**Proposal:** `docs/agents/unexecuted_proposals/progressive-view.md`  
**Mockups:** `docs/agents/unexecuted_proposals/mockups/progressive-view/` (+ A review set under `mockups/clinical-command-surface/review/`)

LinearThrone directed: thinktank first; **he approves**; then TINA tickets. **Do not issue PROP-4.M until he approves.** Prefer sequencing **after PROP-3** foundation.

## One-paragraph recommended route

Ship **Progressive view** as an optional second presentation of the same unit: admin builds a hallway-enough corridor with **templates/paint** and places rooms; nurses get **glance-only** map plus assignment columns; wall map follows PROP-3 identifier and no-idle-lock rules. **Shared clinical truth** with Option A (rooms/assignments), not two layouts’ worth of duplicate patients. Do not start before PROP-3 tokens/wall privacy land.

## Suggested next tickets (not binding; hold for approval)

| Split | Role | One-line |
| --- | --- | --- |
| PROP-4.1 | DBD/BED | Progressive geometry schema keyed to room ids |
| PROP-4.2 | FED-01 | Admin corridor templates/paint + place rooms |
| PROP-4.3 | FED-01 | Progressive workstation columns + glance map |
| PROP-4.4 | FED-01 | Progressive wall map |
| PROP-4.5 | FED-01 | A vs Progressive view picker |
| PROP-4.6 | SEC-01 | PHI/idle audit on Progressive surfaces |
| PROP-4.7 | QA-01 | Setup + glance + wall privacy regressions |

## Open questions for PM

1. After geometry exists, default view for new units?
2. Are Progressive columns assignable, or is A the only assign surface?

## Explicit non-goals

- Blueprints / true scale / cloud CAD
- Nurse authoring or drag-on-Progressive-map
- Dual patient lists
- Shipping inside PROP-3

TT-01 does not ticket FED/BED/SEC/QA.
