# PROP-3.2 — FED-01 → PM-01

**Status:** Pass (local)  
**Ticket:** `PROP-3.2-PM01-to-FED01.md`

## Did

Same-grid workstation expression on the existing room map. No `gridRow` / `gridColumn` change. Smoke selectors kept (`[data-patient-id]`, Print → Charge report).

- Assigned occupied rooms: full contrast. Removed `opacity-70`. Settled mark is shape + **Assigned** (nurse name when identifiers are on). Unassigned rooms keep a loud **No nurse** mark and a stronger border.
- Safety marks: shape + short text for isolation subtype (Contact square/dashed, Airborne diamond/double, Droplet circle/dotted), Fall, DNR, Restraints, and Name. Color is a second channel only.
- Header census grouped: Census / Staff / Safety. Isolation subtypes listed. Facility name and optional logo lead; **UnitView** is the tool name. Stethoscope hero removed.
- Name-alert last-name twins get a **Name** mark on the card. Banner still lists names on workstation only.

## Evidence

- `cd renderer && ./node_modules/.bin/tsc --noEmit` — exit 0.
- `npx --yes tsx --test renderer/src/lib/safety-marks.test.ts` — 4/4 pass (isolation subtypes, Fall/DNR/Restraints/Name shape+text, isolation breakdown, name-alert keys).
- Browser: admin login → North-South View → Insert mock patients. Header shows facility name first, UnitView as tool name, Census/Staff/Safety groups, isolation subtypes, Print → Charge report. Cards show shape+text marks (Contact, Fall, DNR, Name) and No nurse / Assigned at full contrast (no `opacity-70`).

## Not in this ticket

Wall chrome (3.4). QA Pass (3.5). Option B floorplan.
