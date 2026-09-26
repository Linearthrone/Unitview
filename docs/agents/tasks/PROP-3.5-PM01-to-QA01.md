---
prop_id: PROP-3.5
from: PM-01
to: QA-01
depends_on: PROP-3.1, PROP-3.2, PROP-3.3, PROP-3.4
status: blocked-on-prior
---

# PROP-3.5 — PM-01 → QA-01 (command-surface evidence)

**From:** TINA (PM-01)  
**To:** QA-01  
**Proposal:** PROP-3 Option A  

## Do

Prefer `cd renderer && npm run qa:smoke` plus named manual rows. Do not modify product code.

| Row | Pass |
| --- | --- |
| Smoke | Sign in, enter a unit, Print → Charge report, oncoming-shift control, `[data-patient-id]` drag |
| Safety glance | Isolation subtype, fall, DNR, restraints, name alerts readable without hover on workstation; color not the only channel |
| Assigned rooms | Occupied-and-assigned cells are full contrast (not ~70% opacity) |
| Type | Body remains Arial 18px; muted/body contrast WCAG AA |
| Wall | Identifiers off; admit/EDD + safety marks on; session does **not** idle-lock |
| Kill list | No glass/blur/gradient washes on cards; no global `!important` color transition |

File `docs/agents/issues/ISSUE-…md` for defects. Report `PROP-3.5-QA01-to-PM01.md`.

## Done

Pass or Fail with evidence. After Pass, PM dispatches SLOP-01.
