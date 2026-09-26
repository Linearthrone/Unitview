---
type: proposal
status: sent-to-pm
tt_id: TT-01
prop_id: PROP-4-progressive-view
created: 2026-09-21
updated: 2026-09-21
title: Progressive view
need: Optional unit presentation with corridor map + cards for marketing and wall aesthetics, after the PROP-3 command surface.
sent_at: 2026-09-21
pm_intake: docs/agents/tasks/PROP-4-TT01-to-PM01.md
---

# Progressive view

## 1. Need / Want

After PROP-3’s same-map clinical command surface, offer a **Progressive view**: abstract hallway map + card language for marketing eye-catch and wall-map aesthetics. Selectable by facility type/size. Admin authors the hallway; nurses only look.

## 2. Goal & Success Criteria

1. Admin can pick a corridor template and/or paint a hallway-enough shape, then place rooms — not to scale, no blueprints.
2. Progressive workstation shows nurse **columns** (assignments) plus a **glance-only** map (no drag on the map).
3. Progressive wall map hides patient identifiers; keeps clinical quick-reference (occupancy, safety marks, admit/EDD); no idle lock (same wall rules as PROP-3).
4. **One clinical truth** for the unit: rooms, census, assignments, safety flags are shared with Option A. Two presentations, not two patient lists.
5. Does not block or reopen PROP-3 execution. Sequence: A ships first; Progressive is opt-in afterward.

## 3. Context & Constraints

- Depends on / follows **PROP-3-clinical-command-surface** (Option A tokens, wall PHI, no idle-lock).
- Product: UnitView Electron, local-first PHI. No cloud CAD. No third-party drawing uploads.
- Today Create Unit places Room + staff cards on one rectangular grid; that remains A’s assignment instrument.
- Kurt locks (2026-09-21): name **Progressive view**; admin corridor templates/paint; nurses glance-only; hallway-enough; shared clinical truth with two presentations (accepted for send-to-PM).

## 3.1 Mockups for review

Under `docs/agents/unexecuted_proposals/mockups/`:

**Option A (PROP-3) — `clinical-command-surface/review/`**

| File | Screen |
| --- | --- |
| `review-a1-login.png` | Login |
| `review-a2-facility-home.png` | Facility home |
| `review-a3-workstation-dark.png` | Assignment grid dark |
| `review-a4-workstation-light.png` | Assignment grid light |
| `review-a5-wall.png` | Wall (identifiers off) |
| `review-a6-room-cards.png` | Room card language |
| `review-s4-print-preview.png` | Print preview dialog |
| `review-s1-oncoming-command.png` | Oncoming shift setup (command surface) |
| `review-s3-activate-oncoming.png` | Activate oncoming confirmation |

Earlier concepts also in parent `clinical-command-surface/`. Liked north stars: **A1, A2**.

**Progressive (PROP-4) — `progressive-view/`**

| File | Screen |
| --- | --- |
| `review-p1-admin-corridor-setup.png` | Admin templates ★ |
| `review-p2-admin-place-rooms.png` | Admin place rooms |
| `review-p3-progressive-workstation.png` | Columns + glance map ★ |
| `review-p4-progressive-wall.png` | Wall map |
| `review-p5-view-mode-picker.png` | A vs Progressive picker ★ |
| `review-s2-oncoming-progressive.png` | Oncoming draft Progressive |
| `review-m1-marketing-contrast.png` | Marketing contrast |
| `explain-a-vs-progressive-layouts.png` | Data model diagram |

**Print — `print/`**

| File | Screen |
| --- | --- |
| `review-u1-unit-setup-contacts.png` | Unit setup: persistent charge + front desk ★ |
| `review-print2b-roster-portrait.png` | Locked roster portrait ★ |
| `review-print2b-roster-landscape.png` | Locked roster landscape ★ |
| `review-print3-nurse-blocks-landscape.png` | Nurse blocks landscape ★ |
| `review-print3-blocks-detail.png` | PCT cards / alerts / call-outs detail |
| `review-s5-print2-orientation-preview.png` | Roster orientation toggle |
| `review-s6-print-layout-picker.png` | Roster vs nurse-blocks picker |
| `PRINT2-SPEC.md` / `PRINT-LAYOUTS-SPEC.md` | Locked print specs |

Concept art only — not shipped UI.

## 4. Clarifying Q&A (answered)

| # | Answer |
| --- | --- |
| Name | **Progressive view** |
| Authoring | Admin corridor **templates / paint** + place rooms |
| Fidelity | Hallway-enough, not-to-scale; no blueprints |
| Nurses | Glance-only on the map |
| Layouts | **Shared clinical truth; two presentations** (A grid placements + Progressive corridor/pins). Not two separate units. |

## 5. Avenues Explored

Covered under PROP-3 thinktank + Progressive follow-ups. Avenue chosen: Progressive as optional second presentation after A.

Rejected: blueprint underlay, cloud CAD, nurse authoring, drag-on-Progressive-map, shipping Progressive inside PROP-3.

## 6. Recommended Route

1. Complete PROP-3 (A) first — tokens, same-grid expression, wall privacy/no idle-lock.
2. PROP-4: persist Progressive geometry per unit (corridor template/mask + room pin positions keyed by room id).
3. Admin setup UI: templates → optional paint → place rooms → save.
4. Progressive workstation: nurse columns bound to existing assignments; map glance-only.
5. Progressive wall: same PHI/idle rules as PROP-3 wall; map-forward composition.
6. Facility/unit setting: choose Command surface (A) vs Progressive view; default A until Progressive geometry exists.

## 7. Alternatives (parked)

- Fully separate layouts / dual patient lists — rejected for send; higher sync risk.
- Enhanced Create Unit grid only (no paint) — weaker hallway aesthetic; may revisit if paint is too costly.
- Blueprint underlay — rejected.

## 8. Risks & Kill Criteria

- Progressive map shows patient names or identifier-bearing print DOM on wall.
- Nurses required to maintain Progressive geometry during shift.
- Two censuses / two assignment sources for one unit.
- Glass, motion, or safety-as-color-only on the Progressive map.
- Shipping Progressive before PROP-3 wall/token foundation.

## 9. Open Questions for User / PM

None blocking send. PM may refine:

1. Default view for new units after Progressive geometry exists.
2. Whether Progressive columns allow assignment edits or are read-only with A as the only assign surface.

## 10. Suggested PM Handoff

- `prop_id`: **PROP-4-progressive-view**
- Intake: `docs/agents/tasks/PROP-4-TT01-to-PM01.md`
- Suggested splits (after PROP-3 acceptance / sequencing):
  - `PROP-4.1` — **DBD/BED** — Schema for Progressive corridor + room pins keyed to room ids; no second patient table.
  - `PROP-4.2` — **FED-01** — Admin templates/paint + place-rooms setup.
  - `PROP-4.3` — **FED-01** — Progressive workstation (columns + glance map).
  - `PROP-4.4` — **FED-01** — Progressive wall map (PHI/idle from PROP-3).
  - `PROP-4.5` — **FED-01** — View mode picker (A vs Progressive).
  - `PROP-4.6` — **SEC-01** — Confirm wall/identifier rules on Progressive surfaces.
  - `PROP-4.7` — **QA-01** — Setup, glance map, wall privacy, no dual-census regressions.
- What PM should decide first: sequence after PROP-3; whether columns are assignable or read-only.
