---
type: proposal
status: accepted-pm-ticketed
pm_tickets:
  - PROP-3.1-PM01-to-FED01.md
  - PROP-3.2-PM01-to-FED01.md
  - PROP-3.3-PM01-to-SEC01.md
  - PROP-3.4-PM01-to-FED01.md
  - PROP-3.5-PM01-to-QA01.md
tt_id: TT-01
prop_id: PROP-3-clinical-command-surface
created: 2026-09-21
updated: 2026-09-21
title: Clinical command surface
need: Make UnitView look like the future of healthcare — professional, engaging, and calm — without turning the unit board into a consumer app or a new spreadsheet.
sent_at: 2026-09-21
pm_intake: docs/agents/tasks/PROP-3-TT01-to-PM01.md
---

# Clinical command surface

## 1. Need / Want

LinearThrone wants a full UI redesign. UnitView should look like the future of healthcare: professional, engaging, and pleasing to look at. It should not feel like dated spreadsheet manipulation.

## 2. Goal & Success Criteria

A charge nurse recognizes the unit on day one, can still drag a room onto a nurse, and can print the charge sheet without a tour. The board no longer reads as a 2018 admin grid (Arial, double borders, equal stat chips, icon salad).

Success is both of these, and the first one kills the work if it fails:

1. **Safety glance.** Isolation subtype, fall risk, DNR, restraints, and name alerts are readable with no hover, on the workstation and in black-and-white print. Color is never the only channel.
2. **Calm command surface.** Occupied-and-assigned rooms are quiet and full contrast. Unassigned or unsafe rooms are the only cells that speak. Facility branding leads; UnitView is the tool name, not a stethoscope hero.
3. **Same job.** The 17×10 map, stable room positions, drag-and-drop, census contents, admit/discharge dialogs, Spectra, and both print targets stay. WALLDISPLAY hides patient identifiers only (not clinical quick-reference fields).
4. **No storage program.** No vault rewrite, no SQLite, no React/Vite/Tailwind major upgrade, no split of `unit-view-client.tsx` in this wave.

## 3. Context & Constraints

- Product is UnitView `5.1.5-c` (Electron, React 18, Vite, Tailwind, shadcn). Not House Victoria.
- Local-first PHI. HIPAA source of truth: `docs/HIPAA_AND_EPIC_FHIR.md`. Renderer must not become the long-term PHI owner.
- April 2026 UI checklist (`docs/agents/ui-review/TASK-20260422-013-UI-DECISION-CHECKLIST.md`) kept almost every control, asked for a clinical-dark login, a facility logo slot, better contrast, and roles including WALLDISPLAY. It also conflicts with itself on five named themes versus light + clinical-dark only, and on 18px Arial versus a denser heading scale.
- Visual debt today:
  - `renderer/src/globals.css` owns shadcn HSL tokens, Arial at 18px, and print (white, ~10pt, `.print-hide`).
  - `renderer/src/themes.css` is a second RGB theme system (`theme-light|dark|blue|green|purple`) plus `* { transition: … !important }` on every node. Settings already tell users the extra themes are deprecated, but the store still types five `global_theme` values.
  - The unit board often never receives Tailwind’s `dark` class, so `dark:` utilities and `themes.css` overrides disagree. That mismatch is a large part of the dated look.
  - Clinical meaning is hardcoded Tailwind hues in `patient-block.tsx` and `app-header.tsx`. Fall risk, seizure, aspiration, and isolation can share one accent. Some alerts are icon-only with a tooltip, which is why an icon-legend dialog exists. Assigned patients render at about 70% opacity, so the staffed unit is the dimmest view.
  - Header census is a wrap of equal bordered chips. Wallpaper snapshot already uses the failure mode (gradients, hairline borders, tiny type), not the target.
- Playwright smoke (`renderer/smoke/qa-smoke.spec.ts`) keys off login labels, unit select, Print → Charge report, the oncoming-shift control, and `[data-patient-id]` drag. There is no screenshot gate.
- PROP-1 (persist honesty) and PROP-2 (in-memory transitions) are merged. Do not couple this to storage.
- Create Unit already authors the spatial map (rows/cols + card placement). That authoring stays for PROP-3.

## 3.1 Visual mockups (exploratory)

Concept art only — not shipped UI. Files under `docs/agents/unexecuted_proposals/mockups/clinical-command-surface/`.

| File | What it shows |
| --- | --- |
| `mockup-01-today-spreadsheet-board.png` | Contrast: today’s equal chips + icon-row cards |
| `mockup-02b-option-a-same-map-workstation.png` | **A (this PROP):** same map (rooms + nurse cards together), new chrome |
| `mockup-05-option-a-light.png` | **A** light mode |
| `mockup-03-option-a-wall.png` | **A** wall: no patient names; admit/EDD and safety marks kept |
| `mockup-02-option-a-workstation.png` | Draft — drifted to a nurse sidebar; superseded by `02b` |
| `mockup-04-option-b-new-layout.png` | **Progressive view (later):** nurse columns + abstract floorplan |
| `explain-a-vs-progressive-layouts.png` | How A assignment grid vs Progressive map organize the same unit |

## 4. Clarifying Q&A (answered)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Board structure | **Ship Option A now** (same map, new look). Progressive view later as optional alternate by facility type/size. |
| 2 | Wall content | Hide **patient identifiers only**; keep clinical quick-reference (including admit/EDD). |
| 3 | Typeface | **Keep** Arial at 18px. |
| 4 | Wall idle lock | **No idle lock** for WALLDISPLAY. Nurse workstations still lock. |
| 5 | Floorplan authoring | **Admin-only at facility setup.** Corridor **templates / paint**, then place rooms. Hallway-enough, not-to-scale. No blueprints. Nurses do not author. |
| 6 | Why Progressive later | Marketing eye-catch and wall-map aesthetics. |
| 7 | Floorplan fidelity | Hallway-enough; no precise scale or blueprints. |
| 8 | Product name for B | **Progressive view** (locked). |
| 9 | Nurse use of Progressive map | **Glance-only.** Once rooms are set up, nurses only need to see the map — no drag on the Progressive map. |
| 10 | One layout or two? | **Open — see §9.6.** Kurt unsure; TT recommends shared rooms/assignments with two *presentations*, not two clinical units. |
| 10 | One layout or two? | **Locked for PROP-4 send:** shared clinical truth; two presentations (A grid + Progressive corridor/pins). |

## 5. Avenues Explored

Seats: STRAT, CONTRA, SYS, RISK, USER (+ light pass on floorplan authoring). No seat edited product code.

**STRAT.** Ship skin + same-grid expression first. New layout is a second program.

**CONTRA.** Kill glass/motion/icon-only safety. Do not add a third token system.

**SYS.** Unify `themes.css` into `globals.css` first. Card skin on the same map is the win. Do not split `unit-view-client.tsx`. Print stays white.

**RISK.** Wall: hide identifiers only; no idle lock; no CDNs; 18px floor.

**USER.** Same map, two distances; labeled safety marks; stop fading assigned rooms.

### Conflicts resolved for PROP-3

| Topic | Resolution |
| --- | --- |
| A vs B | **A ships in PROP-3.** Progressive view later (corridor templates/paint; glance-only). |
| Floorplan authoring | Out of PROP-3. Progressive: admin templates/paint; hallway-enough; no blueprints. |
| Themes | Light + clinical-dark only. |
| Type | Arial 18px. |

### Avenue A — How the board is organized (**this PROP**)

Option A does **not** invent a new room model. It keeps today’s Create Unit + live board:

1. Admin sets `layoutRows` × `layoutCols` and places cards of kind `Room`, `Staff Nurse`, `Patient Care Tech`, `Unit Clerk` on cells (`LayoutCardPlacement`: row/column).
2. Those become live `gridRow` / `gridColumn` on patients and staff.
3. Charge nurses **drag room tiles onto nurse cards on that same grid** to assign. Empty cells approximate hallway only loosely.

Nurse columns + abstract floorplan / map + card style. LinearThrone wants this for **marketing eye-catch** and **wall-map aesthetics**, offered later by facility type/size (label TBD: “classic style” / “traditional view”).

### Avenue B — Progressive view (parked follow-on PROP)

**Name:** Progressive view.  
Map + card / nurse columns + abstract hallway. Marketing and wall aesthetics. Optional by facility type/size.

**Authoring (locked):**

- **Who:** Facility admin at setup — not nurses.
- **How:** Corridor **templates / paint**, then place rooms. Hallway-enough, not-to-scale. No blueprints.
- **Nurse use:** Map is **glance-only** after setup. No drag on the Progressive map.

PROP-3 must not implement Progressive view. Document only.

### How A and Progressive relate (for Kurt’s open question)

They *feel* like two layouts because they *are* two jobs:

| | Option A (PROP-3) | Progressive view (later) |
| --- | --- | --- |
| Job | Assign patients to nurses by dragging on a grid | Orient on a hallway map (wall / marketing / glance) |
| What’s on the spatial surface | Rooms **and** staff cards | Rooms on a painted hallway; staff live in **columns**, not on the map |
| Who edits space | Admin in Create Unit (rooms + staff cards) | Admin with corridor templates/paint + room pins |
| Nurse interaction | Drag on the grid | Look only |

**TT recommendation (not locked):** one unit, **one clinical truth** (rooms, census, assignments, safety flags), **two presentations**:

- **A placement:** grid cells for the assignment board (today’s model, restyled in PROP-3).
- **Progressive placement:** corridor mask + room pins for the map (new, admin-only).

Do **not** maintain two separate patient lists. Do **not** require nurses to keep two boards in sync. Admin may set Progressive geometry once per unit; assignments still happen on A (or on Progressive nurse columns reading the same assignment data).

**Alternative Kurt could still choose:** fully separate layouts (heavier). Only pick that if Progressive cannot be driven from shared room IDs.

Diagram: `mockups/clinical-command-surface/explain-a-vs-progressive-layouts.png`.

### Avenue C — Staged program name

C1 foundation + C2 expression = PROP-3. C3 facility-home polish only if C2 still feels dated. B is **not** C3 — B is a separate later PROP.

## 6. Recommended Route

**Ship Option A as PROP-3.** Calm clinical command surface on the existing room map.

**Locked product decisions** (LinearThrone, 2026-09-21):

- **Board (PROP-3):** Option A — same map, new look. Keep the cell map, drag-and-drop, context menus, Spectra, both print targets. Do not change stored `gridRow` / `gridColumn` semantics.
- **Follow-on (not PROP-3):** **Progressive view** — optional by facility type/size; marketing + wall aesthetics. Admin: corridor templates/paint + place rooms. Nurses: glance-only map. Hallway-enough, no blueprints. Layout relationship to A: see §9.6 (recommended shared clinical truth, two presentations).
- **Type:** Arial at 18px. Wall room numbers may be larger.
- **Wall PHI:** Hide patient identifiers only. Keep clinical quick-reference including admit/EDD. Name-alert *strings* with patient names stay off the wall.
- **Wall idle lock:** WALLDISPLAY does not idle-lock. Workstations still lock. Clear PHI on explicit logout / switch-user. Print/export off wall role.

**Visual defaults:**

- Light + clinical-dark only.
- Assigned rooms full contrast + settled mark (no opacity-as-done).
- Safety: shape + short text; contact / airborne / droplet distinct; clinical hues not folded into `--primary`.
- No glass, blur, gradient washes, remote assets, patient photos, pulsing alerts. Honor `prefers-reduced-motion`.
- Audit stays admin-visible; no PHI in new toasts/tooltips.

**First ship:** C1 foundation + C2 workstation expression. Wall chrome after SEC privacy + no-idle-lock.

## 7. Alternatives (parked)

- **Option B / Progressive view** — later PROP; corridor templates/paint; glance-only for nurses; label **Progressive view**.
- **Consumer-health visual language** — rejected for PROP-3 execution (Progressive wall may be more expressive later without glass/PHI risk).
- **Cloud CAD / blueprint / true-scale floorplan authoring** — out. Hallway-enough abstract map only.
- **Big-bang dialog / shift-maker / wallpaper / print restyle** — after the board, not inside PROP-3.

## 8. Risks & Kill Criteria

Kill or stop a slice when:

- Isolation subtype, fall risk, DNR, restraints, or name alerts become icon-only, color-only, or tooltip-only.
- Body/muted text below WCAG AA or body size below 18px.
- Glass, blur, translucency, or gradient washes on cards/census/name-alert banner.
- Motion on room cards, or the global `!important` transition kept.
- Density drops so the full unit is no longer the primary view; census collapsed by default.
- Third token system; vault rewrite; React/Tailwind major bump; split of `unit-view-client.tsx`.
- WALLDISPLAY shows person-identifying fields or mounts name-bearing print DOM / tooltips.
- Smoke cannot sign in, enter a unit, open charge report, or drag `[data-patient-id]`.

## 9. Open Questions for User / PM

None blocking PROP-3.

### 9.5 Progressive view — locked for follow-on

| Item | Lock |
| --- | --- |
| Name | **Progressive view** |
| Authoring | Admin corridor **templates / paint** + place rooms |
| Fidelity | Hallway-enough, not-to-scale; no blueprints |
| Nurses | **Glance-only** map after setup |

### 9.6 Still open — one layout or two?

Kurt: unsure whether A and Progressive need two layouts for the same unit; unclear how A organizes rooms.

**How A organizes rooms (today / PROP-3):** one rectangular cell grid. Admin places room cards and staff cards on cells in Create Unit. Nurses assign by dragging room tiles onto nurse cards on that same grid. PROP-3 restyles this; it does not change the placement model.

**TT recommendation:** shared clinical data (rooms + assignments); **A grid placements** for the assignment board; **Progressive corridor + room pins** for the glance map. Two presentations, not two units.

**Need from Kurt:** accept that recommendation, or insist on fully separate layouts?

## 10. Suggested PM Handoff

- `prop_id`: **PROP-3-clinical-command-surface**
- Intake: `docs/agents/tasks/PROP-3-TT01-to-PM01.md`
- Suggested splits (hints; TINA may re-divide):
  - `PROP-3.1` — **FED-01** — One token source; retire `themes.css` overrides + global transition; print white / ~10pt / `.print-hide`; Arial 18px. No vault redesign.
  - `PROP-3.2` — **FED-01** — Same-grid workstation expression: cards, grouped census, no assigned fade, labeled safety marks. Preserve smoke selectors and drag nodes. No `gridRow`/`gridColumn` semantic change.
  - `PROP-3.3` — **SEC-01** — WALLDISPLAY: hide identifiers only; keep clinical quick-ref; disable idle lock for wall only; no name leak via print DOM/tooltips.
  - `PROP-3.4` — **FED-01** — Wall chrome after 3.3.
  - `PROP-3.5` — **QA-01** — Smoke + contrast/safety-glance; wall identifiers off; wall does not idle-lock.
- **Do not** ticket Progressive view under PROP-3. Park as a future PROP after A ships.
- What PM should decide first: accept Avenue A route and ticket 3.1 → 3.2; fan 3.3 when capacity allows.

### 9.6 Layout relationship — locked for PROP-4

**Shared clinical truth; two presentations.** A keeps grid placements for assignment. Progressive stores corridor + room pins for glance/wall. Not two patient lists. See `PROP-4-progressive-view`.

## 10. Suggested PM Handoff

- `prop_id`: **PROP-3-clinical-command-surface** (this file)
- Progressive follow-on sent separately as **PROP-4-progressive-view**
- Suggested PROP-3 splits unchanged: 3.1–3.5
- What PM should decide first: accept PROP-3 and ticket 3.1 → 3.2; hold Progressive until A foundation lands.
