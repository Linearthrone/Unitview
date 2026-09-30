# TASK-20260422-013 — UI Decision Checklist

## Document control

| Field | Value |
|:------|:------|
| **Owner (you fill decisions)** | User + PM-01 |
| **Prepared by** | DEV-01 |
| **Status** | **User review complete — PM approved for Phase 2** (2026-04-30) |
| **Clarifications** | `docs/agents/reports/TASK-20260422-013-PM01-CLARIFICATIONS-RESOLVED.md` |
| **Related task** | TASK-20260422-013 |
| **Phase 1 report** | `docs/agents/reports/TASK-20260422-013-PHASE1-DEV01-to-PM01.md` |
| **Audit date** | 2026-04-22 |

---

## Quick reference — how to fill this out

### A. Existing UI items (tables labeled **Items**)

For each row, mark **all that apply**:

| Column | Question |
|:-------|:---------|
| **Keep?** | Should this stay in the section where it lives today? |
| **Exclude?** | Should this be removed or hidden from that section? |
| **Move?** | Should this live in a **different** section? |
| **If moving →** | Name the target section (only when Move? is checked) |
| **Notes** | Optional context for PM |

> Keep, Exclude, and Move are independent. PM resolves conflicts after your review.

### B. DEV suggestions (tables labeled **Suggestions**)

| Column | Purpose |
|:-------|:---------|
| **Approve** | Accept as proposed |
| **Deny** | Reject |
| **Your modification** | Change the proposal — PM retasks DEV from this text |

**Editing tip:** change `☐` to `☑` or `[x]` when you decide.

---

## Table of contents

| Part | § | Screen / area | Item rows | Suggestion rows |
|:-----|:-:|---------------|----------:|----------------:|
| **A — Entry & navigation** | 1 | Login | 9 | 4 |
| | 2 | User dashboard | 35 | 4 |
| | 9 | Admin dashboard | 7 | 3 |
| **B — Unit workspace** | 3 | App header | 32 | 4 |
| | 4 | Unit map | 25 | 4 |
| | 5 | Staff cards | 24 | 4 |
| | 6 | Spectralink table | 10 | 4 |
| **C — Overlays & system** | 7 | Dialogs & overlays | 38 | 4 |
| | 8 | Footer & global chrome | 3 | 3 |
| | 10 | Theme & tokens | 9 | 4 |
| | | **Totals** | **181** | **38** |

---

# Part A — Entry & navigation

---

## §1 — Login screen

### 1.1 Items — Login form

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 1.1.1 | App title / branding | X☐ | ☐ | ☐ | | Should also include an empty image placeholder for the facility to have its name and image appear.|
| 1.1.2 | App subtitle ("Hospital Patient Management System") | X☐ | ☐ | ☐ | | |
| 1.1.3 | Employee ID field | X☐ | ☐ | ☐ | | |
| 1.1.4 | Password field | X☐ | ☐ | ☐ | | |
| 1.1.5 | Login button | X☐ | ☐ | ☐ | | |
| 1.1.6 | Sign-in loading spinner state | X☐ | ☐ | ☐ | | |
| 1.1.7 | Error / validation messages | X☐ | ☐ | ☐ | | |
| 1.1.8 | Administrator login link | ☐ | X☐ | ☐ | | this should be handled by the login itself. if the person logging in is an administrator, they will have the permissions assigned to their profile|
| 1.1.9 | Default demo credentials hint (dev) | x☐ | ☐ | ☐ | | |

### 1.2 Suggestions — Login

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 1.2.1 | Replace light blue gradient with clinical-dark full-screen surface; center a single elevated card with neutral border and high-contrast labels |X☐ | ☐ | |
| 1.2.2 | Use hospital icon + wordmark lockup consistent with unit-view header (stethoscope motif) for brand continuity | X☐ | ☐ | |
| 1.2.3 | Hide demo credential hints behind a dev/admin flag or remove from production builds | X☐ | ☐| put  this in admin settings, give admin default login of admin for user id and password for password, don't display that on the login screen|
| 1.2.4 | Add subtle focus rings and larger touch targets on fields for kiosk / shared workstation use | X☐ | ☐ | |

---

## §2 — User dashboard (facility home)

### 2.1 Items — Header & identity

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.1.1 | Welcome / user name | X☐ | ☐ | ☐ | | |
| 2.1.2 | User role display (Administrator / User) | X☐ | ☐ | ☐ | |Lets specify some roles; Entity Admin, Facility Admin,, Nurse Manager, Charge Nurse, Nurse, WALLDISPLAY |
| 2.1.3 | Logout control | X☐ | ☐ | ☐ | | |
| 2.1.4 | Back to login button | ☐ | X☐ | ☐ | | |
| 2.1.5 | Settings entry (icon) | X☐ | ☐ | ☐ | | |
| 2.1.6 | Theme toggle (light/dark) | ☐ | ☐ | X☐ | | Move this to be a settings thing, and give better contrasts between the background colors and the text colors.  |
| 2.1.7 | Full-page loading spinner | X☐ | ☐ | ☐ | | |

### 2.2 Items — Facility statistics strip

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.2.1 | Facility overview section title + description | X☐ | ☐ | ☐ | | |
| 2.2.2 | Total units count | X☐ | ☐ | ☐ | | |
| 2.2.3 | Total rooms / beds (occupied / total) | X☐ | ☐ | ☐ | | |
| 2.2.4 | ADT quick look (admissions / discharges / transfers) | ☐ | X☐ | ☐ | | |
| 2.2.5 | Staff count (nurses + techs breakdown) | X☐ | ☐ | ☐ | | |
| 2.2.6 | Fall risk count (occupied patients) | X☐ | ☐ | ☐ | | |
| 2.2.7 | Isolation count (occupied patients) | X☐ | ☐ | ☐ | |Lets get a general breakdown of isolation types, contact, airborne, droplet |
| 2.2.8 | Inline success / error alert banner | X☐ | ☐ | ☐ | | |

### 2.3 Items — Unit list

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.3.1 | Scrollable unit list (selectable rows) | X☐ | ☐ | ☐ | | *List inside Select Unit card — not a card grid* |
| 2.3.2 | Unit name + theme color dot | X☐ | ☐ | ☐ | | |
| 2.3.3 | Per-unit theme label (light/dark/blue/green/purple) | X☐ | ☐ | ☐ | | |
| 2.3.4 | Unit created date on row | ☐ | X☐ | ☐ | | |
| 2.3.5 | Enter unit action | ☐ | ☐ | ☐ | | |
| 2.3.6 | Last-opened unit highlight / badge | ☐ | ☐ | ☐ | | |
| 2.3.7 | Context menu (edit unit) | ☐ | X☐ | ☐ | |This is an admin task and shouldn't appear in the app unless they are an admin |
| 2.3.8 | Create new unit button | ☐ | X☐ | ☐ | |This is also an admin task and shouldn't appear in the app unless they are and admin |
| 2.3.9 | Dev mock units auto-seeder (on first load) | ☐ | X☐ | ☐ | |No there shold be a button, but only an admin, or demo login should see mock patients, and only afer they click the button from the menu to add mock patients |

### 2.4 Items — Unit selector (dropdown)

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.4.1 | Unit dropdown + Enter button | X☐ | ☐ | ☐ | |Make sure that when you do select a unit the text block actually populates your selection in the text box, instead of leaving it blank to guess about |

### 2.5 Items — Dashboard settings sub-screen

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.5.1 | Full settings screen vs modal | X☐ | ☐ | ☐ | | **PM resolved:** keep full settings screen (not modal) |
| 2.5.2 | Five-theme color picker (light/dark/blue/green/purple) | ☐ | ☐ |X ☐ | |mentioned above this should be in th settings area,with better contrast for bg and text color readability |
| 2.5.3 | Account info (employee #, name, role, last login) | X☐ | ☐ | ☐ | | *Read-only; no password change in code* |
| 2.5.4 | Application info (version, local storage) | X☐ | ☐ | ☐ | | |
| 2.5.5 | Back to dashboard control |X ☐ | ☐ | ☐ | | |

### 2.6 Items — Edit unit dialog

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 2.6.1 | Rename unit field | ☐ | X☐ | ☐ | |Admin only task |
| 2.6.2 | Unit theme selector | ☐ |X ☐ | ☐ | | Admin only task|

### 2.7 Suggestions — Dashboard

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 2.7.1 | Collapse facility stats into expandable panel to prioritize unit entry on first paint |X ☐ | ☐ | |
| 2.7.2 | Pin favorite units to top with star affordance (persist per user) |X ☐ | ☐ | |
| 2.7.3 | Unify dashboard chrome with unit-view clinical-dark tokens; retire per-unit blue/green/purple dashboard themes |X ☐ | ☐ | |
| 2.7.4 | Replace duplicate dropdown + scrollable list with a single searchable unit picker grid | X☐ | ☐ | |

---

## §9 — Admin dashboard (administrator login path)

### 9.1 Items — User management

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 9.1.1 | Admin header + branding |X ☐ | ☐ | ☐ | | |
| 9.1.2 | User table (employee #, name, role, status) | X☐ | ☐ | ☐ | | |
| 9.1.3 | Add user dialog |X ☐ | ☐ | ☐ | | |
| 9.1.4 | Edit user dialog |X ☐ | ☐ | ☐ | | |
| 9.1.5 | Reset password dialog | X☐ | ☐ | ☐ | | **PM resolved:** keep for now; deprecate when SSO integrated |
| 9.1.6 | Delete user confirmation | X☐ | ☐ | ☐ | | |
| 9.1.7 | Logout / back to login | X☐ | ☐ | ☐ | | |

### 9.2 Suggestions — Admin

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 9.2.1 | Restyle admin dashboard with same clinical-dark shell as main app for visual continuity |X ☐ | ☐ | |
| 9.2.2 | Gate admin route behind stronger auth or move user management to Electron-only settings | X☐ | ☐ | |
| 9.2.3 | Add unit/layout management links from admin for power users | X☐ | ☐ | |

---

# Part B — Unit workspace

---

## §3 — Unit view · App header

### 3.1 Items — Row 1 · Identity & census

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.1.1 | Unitview title + stethoscope icon | X☐ | ☐ | ☐ | | |
| 3.1.2 | Unit name subtitle | X☐ | ☐ | ☐ | | |
0| 3.1.3 | Patients / Rooms count line | X☐ | ☐ | ☐ | | |
| 3.1.4 | Oncoming shift label in unit name | ☐ | ☐ | X☐ | | *Not in current header; draft shift is separate overlay* lets move this closer to 3.3 section |

### 3.2 Items — Row 1 · Compact clinical stats

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.2.1 | DNR count chip | X☐ | ☐ | ☐ | | |
| 3.2.2 | Restraints count chip | X☐ | ☐ | ☐ | | |
| 3.2.3 | Isolation count chip | X☐ | ☐ | ☐ | | |
| 3.2.4 | 1013/2013 (involuntary hold) chip | X☐ | ☐ | ☐ | | |
| 3.2.5 | Sitter count chip | X☐ | ☐ | ☐ | | |
| 3.2.6 | Foley count chip | X☐ | ☐ | ☐ | | |
| 3.2.7 | Stat labels on desktop (hidden on mobile) | X☐ | ☐ | ☐ | | lets add Central lines chip, and tube feeds chip|

### 3.3 Items — Row 1 · Time & navigation

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.3.1 | Live clock | X☐ | ☐ | ☐ | | |
| 3.3.2 | Date display |X ☐ | ☐ | ☐ | | |
| 3.3.3 | Leave unit button | ☐ | ☐ | X☐ |lets move this to the bottom right corner of the window | |
| 3.3.4 | Layout switcher dropdown (legacy path) | ☐ | X☐ | ☐ | | *When `onLeaveUnit` absent* |

### 3.4 Items — Name alerts banner

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.4.1 | Name similarity alert banner | X☐ | ☐ | ☐ | | |
| 3.4.2 | Acknowledge button | X☐ | ☐ | ☐ | | |
| 3.4.3 | Alert detail list (name + room per group) | X☐ |☐ | ☐ | | |

### 3.5 Items — Row 2 · Primary action bar

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.5.1 | Admit button | X☐ | ☐ | ☐ | | |
| 3.5.2 | Staff (add member) button | X☐ | ☐ | ☐ | | |
| 3.5.3 | Spectra pool button | ☐ | ☐ | X☐ | Right Spectra panel header | **PM resolved:** move to panel (B); role-gate Nurse Manager, Charge Nurse, admins (C) |
| 3.5.4 | Oncoming shift button | X☐ | ☐ | ☐ | | |
| 3.5.5 | Print dropdown (charge / assignments / configure) | ☐ | ☐ | X☐ | |Lets move this to time and navigation section |
| 3.5.6 | Vertical separator before layout controls | X☐ | ☐ | ☐ | | |
| 3.5.7 | Layout lock toggle | ☐ |X ☐ | ☐ | | once layout is finalized by admin this will be meaningless|
| 3.5.8 | Save current layout | ☐ | X☐ | ☐ | | |
| 3.5.9 | More tools menu (test tube icon) | ☐ | ☐ | X☐ | | |

### 3.6 Items — More tools menu

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 3.6.1 | "Admin & dev" menu label | ☐ |X ☐ | ☐ | |This is an admin task only |
| 3.6.2 | Create new unit | ☐ | X☐ | ☐ | | Admin task|
| 3.6.3 | Create new room | ☐ | X☐ | ☐ | |Admin Task |
| 3.6.4 | Save layout as… | ☐ | X☐ | ☐ | | Admin task|
| 3.6.5 | Insert mock patients | ☐ | X☐ | ☐ | | admin task|
| 3.6.6 | Save shift assignments | ☐ | ☐ | X☐ | Lets move this to the primaary action bar| |
| 3.6.7 | Icon explanation | ☐ | ☐ | X☐ |Lets move this to the primary action bar | |

### 3.7 Suggestions — App header

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 3.7.1 | Move clinical stats to collapsible drawer; show only DNR + Isolation when collapsed | X☐ | ☐ | |
| 3.7.2 | Group print + save layout + save assignments under single "Shift output" menu | ☐ | X☐ | |
| 3.7.3 | Hide dev-only items (mock patients, create unit) behind admin role or dev flag |X ☐ | ☐ |with the exceptoin of the ones i flagged to go to main action bar, the others go behind admin role |
| 3.7.4 | Sticky two-row header with reduced vertical padding on scroll | ☐ | ☐ | **PM resolved:** sticky **action bar only**; census/stats scroll away |

---

## §4 — Unit view · Map workspace

### 4.1 Items — Map chrome

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 4.1.1 | North side / South side vertical labels | ☐ | X☐ | ☐ | | |
| 4.1.2 | Zoom controls (+ / − / fit %) | X☐ | ☐ | ☐ | | |
| 4.1.3 | Auto fit-to-viewport zoom on load / resize | X☐ | ☐ | ☐ | | |
| 4.1.4 | Grid skeleton loading state | X☐ | ☐ | ☐ | | |
| 4.1.5 | Add Nurse Card footer button | X☐ | ☐ | ☐ | | |
| 4.1.6 | Staff card drag-to-reposition on grid | X☐ | ☐ | ☐ | | |
| 4.1.7 | Patient drag-to-reposition on grid | X☐ | ☐ | ☐ | | |

### 4.2 Items — Patient room cards

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 4.2.1 | Room designation | X☐ | ☐ | ☐ | | |
| 4.2.2 | Patient name (gender-coded badge colors) | X☐ | ☐ | ☐ | | **WALLDISPLAY:** read-only, no patient identifiers; other roles see names. Gender → icon upper-left (10.1.7) |
| 4.2.3 | Admit / EDD dates on card header | X☐ | ☐ | ☐ | | |
| 4.2.4 | Assigned nurse line on card | X☐ | ☐ | ☐ | | |
| 4.2.5 | Mobility icon + notes preview | X☐ | ☐ | ☐ | | |
| 4.2.6 | Status / alert icons on card footer | X☐ | ☐ | ☐ | | |
| 4.2.7 | Unassigned nurse warning indicator (!) |X ☐ | ☐ | ☐ | | |
| 4.2.8 | Assigned nurse dot indicator | X☐ | ☐ | ☐ | |lets make this a green check |
| 4.2.9 | Vacant room styling (green card) | X☐ | ☐ | ☐ | | |
| 4.2.10 | Blocked room styling (overlay + ban icon) | X☐ | ☐ | ☐ | | |
| 4.2.11 | Dimmed opacity when patient has assigned nurse | X☐ | ☐ | ☐ | | |
| 4.2.12 | Context menu (admit, update, discharge, block, designation, delete) | X☐ | ☐ | ☐ | |lets put quicknote button that opens a textblock with discard and accept buttons. when the accept button is clicked it adds the note to the patient notes with a user id and time/date stamp. |

### 4.3 Suggestions — Map

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 4.3.1 | Minimap or unit overview thumbnail in map corner | X☐ | ☐ | |
| 4.3.2 | Color-code room borders by acuity/isolation instead of gender-based name badge | X☐ | ☐ | |
| 4.3.3 | Neutralize vacant/block styling to muted clinical tokens |X ☐ | ☐ | |
| 4.3.4 | Add mouse-wheel zoom with modifier key hint in zoom control tooltip | X☐ | ☐ | |

---

## §5 — Unit view · Staff cards

> **Related:** TASK-20260430-007 — `+ Assign staff member` on unassigned cards

### 5.1 Items — Charge Nurse card

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 5.1.1 | Role title + star icon | X☐ | ☐ | ☐ | | |
| 5.1.2 | Assigned name display | X☐ | ☐ | ☐ | | |
| 5.1.3 | Hardcoded Spectra display (x5501 when assigned) | X☐ | ☐ | ☐ | | |
| 5.1.4 | **+ Assign staff** button (when unassigned) | X☐ | ☐ | ☐ | | Label should be `+ Assign staff member` per 007 |
| 5.1.5 | Context menu assign / remove | X☐ | ☐ | ☐ | | |

### 5.2 Items — Unit Clerk card

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 5.2.1 | Role title + clipboard icon | X☐ | ☐ | ☐ | | |
| 5.2.2 | Assigned name | X☐ | ☐ | ☐ | | |
| 5.2.3 | Hardcoded phone display when assigned | X☐ | ☐ | ☐ | | |
| 5.2.4 | **+ Assign staff** button (when unassigned) |X ☐ | ☐ | ☐ | | See 007 |
| 5.2.5 | Context menu assign / remove | X☐ | ☐ | ☐ | | |

### 5.3 Items — Staff Nurse / Float Pool card

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 5.3.1 | Nurse name in header | X☐ | ☐ | ☐ | | |
| 5.3.2 | Spectra + relief lines | X☐ | ☐ | ☐ | | |
| 5.3.3 | Patient capacity label | X☐ | ☐ | ☐ | | |
| 5.3.4 | Patient assignment drop slots | X☐ | ☐ | ☐ | | |
| 5.3.5 | Clear assignments button | X☐ | ☐ | ☐ | | |
| 5.3.6 | Remove card (X) control | X☐ | ☐ | ☐ | | |
| 5.3.7 | Card drag handle (whole card draggable) | X☐ | ☐ | ☐ | | |
| 5.3.8 | **+ Assign staff** button (unassigned; opens Add Staff) | X☐ | ☐ | ☐ | | Should use Assign dialog; `New Staff Nurse` not detected as unassigned |

### 5.4 Items — Patient Care Tech card

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 5.4.1 | Tech name + spectra in header | X☐ | ☐ | ☐ | | |
| 5.4.2 | Assignment group (room range) |X ☐ | ☐ | ☐ | | |
| 5.4.3 | Rose-tinted card surface | X☐ | ☐ | ☐ | | |
| 5.4.4 | **+ Assign staff** button (when unassigned) | X☐ | ☐ | ☐ | | See 007 |
| 5.4.5 | Remove card (X) | X☐ | ☐ | ☐ | | |

### 5.5 Suggestions — Staff cards

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 5.5.1 | Unify card surfaces on neutral `bg-card`; role accent stripe only | X☐ | ☐ | |
| 5.5.2 | Show assigned patient count badge on nurse cards (e.g. "3/4") | X☐ | ☐ | |
| 5.5.3 | Dedicated drag handle; assign/remove in card footer | X☐ | ☐ | |
| 5.5.4 | TASK-007: `+ Assign staff member`, AssignStaffDialog with card context, detect placeholder names | X☐ | ☐ | |

---

## §6 — Unit view · Spectralink device table

### 6.1 Items — Table contents

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 6.1.1 | Full-width table below map | ☐ | ☐ |X ☐ | | this table hardly warrants a full width. 1/3 window should be plenty |
| 6.1.2 | Device count badge in header | X☐ | ☐ | ☐ | | |
| 6.1.3 | Device ID column | X☐ | ☐ | ☐ | | |
| 6.1.4 | Status column | X☐ | ☐ | ☐ | | |
| 6.1.5 | Assigned staff column |X ☐ | ☐ | ☐ | | |
| 6.1.6 | Logs count column |X ☐ | ☐ | ☐ | | |
| 6.1.7 | Drag row → drop on staff target grid |X ☐ | ☐ | ☐ | | |
| 6.1.8 | Staff drop-target grid (name + role) | X☐ | ☐ | ☐ | | |
| 6.1.9 | Row context menu (status, logs, unassign) |X ☐ | ☐ | ☐ | | |
| 6.1.10 | Device logs dialog | ☐ | X☐ | ☐ | |Admin task |

### 6.2 Suggestions — Spectra table

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 6.2.1 | Collapse table by default; expand from header "Spectra" action | X☐ | ☐ | |
| 6.2.2 | Move to right side panel docked beside map (collapsible) |X ☐ | ☐ | |
| 6.2.3 | Replace `window.prompt` for add-log with inline modal | X☐ | ☐ | **PM resolved:** approved |
| 6.2.4 | Highlight rows for staff card focused on map | X☐ | ☐ | |

---

# Part C — Overlays & system

---

## §7 — Dialogs & overlays

### 7.1 Items — Patient details (report sheet)

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 7.1.1 | Slide-over sheet (right panel) | X☐ | ☐ | ☐ | |I would like to expand the information fields this shows. need more critical quick checks |
| 7.1.2 | Patient demographics section | X☐ | ☐ | ☐ | | |
| 7.1.3 | Admission details (chief complaint, admit, EDD) | X☐ | ☐ | ☐ | | |
| 7.1.4 | Clinical status (diet, mobility, orientation, LDAs) |X ☐ | ☐ | ☐ | | |
| 7.1.5 | Notes / pending section | X☐ | ☐ | ☐ | | |
| 7.1.6 | Alerts & status ( isolation, restraints, DNR/DNI, comfort care, Time Critical meds,HD/PD, has blood orders) | X☐ | ☐ | ☐ | | |
| 7.1.7 | High-risk category badges | X☐ | ☐ | ☐ | | **PM resolved:** expand; keep on **both** card footer and patient sheet |
| 7.1.8 | Vacant / blocked empty states |X ☐ | ☐ | ☐ | | |
| 7.1.9 | Discharge / transfer button | X☐ | ☐ | ☐ | | |
| 7.1.10 | Edit / Add patient information button |X ☐ | ☐ | ☐ | | |

### 7.2 Items — Admit / update patient dialog

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 7.2.1 | Full form field set |X ☐ | ☐ | ☐ | | |
| 7.2.2 | Risk / isolation toggles |X ☐ | ☐ | ☐ | | |
| 7.2.3 | Vacant bed selector (admit mode) | X☐ | ☐ | ☐ | | |
| 7.2.4 | Assigned nurse selector | X☐ | ☐ | ☐ | | |

### 7.3 Items — Shift maker / oncoming board

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 7.3.1 | Full-screen overlay board | X☐ | ☐ | ☐ | | |
| 7.3.2 | Draggable room list sidebar | X☐ | ☐ | ☐ | | |
| 7.3.3 | Mini-map room selector |X ☐ | ☐ | ☐ | | |
| 7.3.4 | Oncoming nurse cards with drop slots |X ☐ | ☐ | ☐ | |add staff member button to those cards |
| 7.3.5 | Activate oncoming shift | X☐ | ☐ | ☐ | | |
| 7.3.6 | Add / remove nurse cards on draft | X☐ | ☐ | ☐ | | |
| 7.3.7 | Clear assignments per nurse card | X☐ | ☐ | ☐ | | |
| 7.3.8 | Embedded Spectra table on board |X ☐ | ☐ | ☐ | | |
| 7.3.9 | Close board button |X ☐ | ☐ | ☐ | | Add automatic Save_on_close logic, that holds teh oncoming assignment until activated. if shift maker opened again state recalls to last save_on_close state|

### 7.4 Items — Other dialogs

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 7.4.1 | Assign staff dialog |X ☐ | ☐ | ☐ | | |
| 7.4.2 | Add staff member dialog |X ☐ | ☐ | ☐ | | |
| 7.4.3 | Discharge confirmation dialog | X☐ | ☐ | ☐ | | |
| 7.4.4 | Edit room designation dialog | ☐ | X☐ | ☐ | |Admin task |
| 7.4.5 | Save layout dialog | ☐ | ☐ | X☐ | |Admin task |
| 7.4.6 | Create unit dialog (multi-step wizard) | ☐ | ☐ | X☐ | | admin task|
| 7.4.7 | Edit unit dialog | ☐ | ☐ |X ☐ | | admin task|
| 7.4.8 | Manage Spectra dialog | ☐ | ☐ |X ☐ | | Nurse Manager, Charge nurse|
| 7.4.9 | Icon explanation dialog | X☐ | ☐ | ☐ | | |
| 7.4.10 | Assignment print layout configurator |X ☐ | ☐ | ☐ | | |
| 7.4.11 | Hidden printable charge report target | X☐ | ☐ | ☐ | | **PM resolved:** keep — print pipeline only, not user UI |
| 7.4.12 | Hidden printable assignments target | X☐ | ☐ | ☐ | | **PM resolved:** keep — print pipeline only, not user UI |

### 7.5 Suggestions — Dialogs

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 7.5.1 | Tabbed patient details (Overview / Clinical / Notes) vs long scroll | X☐ | ☐ | |
| 7.5.2 | Align shift-maker overlay with main app clinical-dark theme |X ☐ | ☐ | |
| 7.5.3 | Standardize modal headers: icon, title, subtitle, footer button order |X ☐ | ☐ | |
| 7.5.4 | Live preview in assignment print layout configurator | X☐ | ☐ | |

---

## §8 — Footer & global chrome

### 8.1 Items

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 8.1.1 | Unitview copyright footer | X☐ | ☐ | ☐ | | |
| 8.1.2 | Toast notifications |X ☐ | ☐ | ☐ | | |
| 8.1.3 | Print-hide class on header/footer/main workspace |X ☐ | ☐ | ☐ | | |

### 8.2 Suggestions — Footer & global

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 8.2.1 | Slim footer to one line; move version/build to settings only |X ☐ | ☐ | |
| 8.2.2 | Toast top-right with clinical-dark surface; audit destructive contrast | X☐ | ☐ | |
| 8.2.3 | Global saving indicator in header when layout or assignments persist | X☐ | ☐ | |

---

## §10 — Theme & tokens (global)

### 10.1 Items

| # | Item | Keep? | Exclude? | Move? | If moving → | Notes |
|:-:|------|:-----:|:--------:|:-----:|:------------|:------|
| 10.1.1 | Light theme availability |X ☐ | ☐ | ☐ | | |
| 10.1.2 | Dark theme as default in unit view | X☐ | ☐ | ☐ | | |
| 10.1.3 | Five dashboard theme variants (blue/green/purple) |X ☐ | ☐ | ☐ | | |
| 10.1.4 | Primary blue accent | X☐ | ☐ | ☐ | | |
| 10.1.5 | Orange accent for warnings | X☐ | ☐ | ☐ | | |
| 10.1.6 | Rose styling on PCT cards | X☐ | ☐ | ☐ | | |
| 10.1.7 | Gender-coded patient name badge colors | ☐ | ☐ |X ☐ |lets change this to a male/Female icon colored blue/pink, put in upper left of card  | |
| 10.1.8 | 18px base font / enlarged heading scale | X☐ | ☐ | ☐ | | |
| 10.1.9 | Arial system font stack | X☐ | ☐ | ☐ | | |

### 10.2 Suggestions — Theme

| # | Suggestion (DEV) | Approve | Deny | Your modification |
|:-:|------------------|:-------:|:----:|:------------------|
| 10.2.1 | Single neutral card surface for all staff types; role accent border only | X☐ | ☐ | |
| 10.2.2 | Stronger muted-foreground contrast on dark surfaces (TASK-005) | X☐ | ☐ | |
| 10.2.3 | One clinical-dark token set app-wide; deprecate dashboard theme classes | X☐ | ☐ | |
| 10.2.4 | Reduce heading scale multiplier for denser clinical workspace | X☐ | ☐ | |

---

## Review progress (you + PM)

| Part | § | Section | Items reviewed | Suggestions reviewed |
|:-----|:-:|---------|:--------------:|:--------------------:|
| A | 1 | Login | ☐ / 9 | ☐ / 4 |
| A | 2 | Dashboard | ☐ / 35 | ☐ / 4 |
| A | 9 | Admin | ☐ / 7 | ☐ / 3 |
| B | 3 | App header | ☐ / 32 | ☐ / 4 |
| B | 4 | Map | ☐ / 25 | ☐ / 4 |
| B | 5 | Staff cards | ☐ / 24 | ☐ / 4 |
| B | 6 | Spectra table | ☐ / 10 | ☐ / 4 |
| C | 7 | Dialogs | ☐ / 38 | ☐ / 4 |
| C | 8 | Footer | ☐ / 3 | ☐ / 3 |
| C | 10 | Theme | ☐ / 9 | ☐ / 4 |

**Your review complete?** ☑ — **Approved for Phase 2 build** (2026-04-30). See clarifications report.

---

## DEV audit sign-off

| Field | Value |
|:------|:------|
| DEV completed audit of all screens? | ☑ |
| Missing items added to checklist? | ☑ |
| Phase 1 report submitted? | ☑ |
| Report path | `docs/agents/reports/TASK-20260422-013-PHASE1-DEV01-to-PM01.md` |

**Phase 2 ACTIVE** — DEV may implement per checklist + `TASK-20260422-013-PM01-CLARIFICATIONS-RESOLVED.md`.
