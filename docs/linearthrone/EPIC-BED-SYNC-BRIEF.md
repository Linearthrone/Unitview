# Epic bed-keyed patient sync → Charge Nurse Report

| Field | Value |
|--------|--------|
| **Owner** | PM-01 |
| **Version** | 5.3.0-c |
| **Created** | 2026-07-14 |
| **Status** | Spec ready — Epic credentials BLOCKED |

## Product intent

1. Resolve the occupying patient for a UnitView room **by the unit’s bed / room number** (match Epic inpatient location).
2. Populate **everything shown on the Charge Nurse Report** (room-card click → `ReportSheet`) from Epic where available.
3. **Expand** that report (and printable charge report) with an **Allergies** section.

Staff assignments (current/prior nurse & PCT) remain UnitView-owned; Epic does not replace shift assignments.

---

## Charge Nurse Report — field inventory (source of truth = `report-sheet.tsx`)

### Overview

| UI field | UnitView today | Epic FHIR candidates (typical) |
|----------|----------------|--------------------------------|
| Name | `patient.name` | `Patient.name` |
| Age | `patient.age` | derived from `Patient.birthDate` |
| Gender | `patient.gender` | `Patient.gender` |
| Current / prior nurse & PCT | UnitView staff cards | **Do not overwrite from Epic** |
| Chief complaint | `patient.chiefComplaint` | Encounter reason / Condition / ADT reason (facility-specific) |
| Admit date | `patient.admitDate` | `Encounter.period.start` |
| EDD | `patient.dischargeDate` | planned discharge extension / AnticipatedDischarge (facility-specific) |

### Clinical

| UI field | UnitView today | Epic FHIR candidates |
|----------|----------------|----------------------|
| Diet | `patient.diet` | NutritionOrder / Observation |
| Mobility | `patient.mobility` | Observation / CarePlan (often custom) |
| A&O | `patient.orientationStatus` | Observation (often custom / flowsheet) |
| LDAs | `patient.ldas[]` | Device / Procedure / flowsheet (facility-specific) |
| Isolation | `patient.isIsolation` (+ type helper) | Flag / InfectionControl / AllergyIntolerance cross-check |
| Restraints | `patient.isInRestraints` | Flag / Observation |
| Code / DNR | `patient.codeStatus` | Consent / Observation / advance directive |
| Comfort care | `patient.isComfortCareDNR` | often local / care plan |
| 1013/2013 | `patient.isInvoluntaryHold1013` | Flag / Encounter type (GA/state-specific) |
| Sitter | `patient.requiresSitter` | Flag / Order |
| Time-critical meds / HD-PD / Blood | helpers from notes/LDAs | MedicationRequest / ServiceRequest |
| Fall / Seizure / Aspiration | boolean flags | Flag / RiskAssessment / Observation |

### Notes

| UI field | UnitView today | Epic |
|----------|----------------|------|
| Notes | `patient.notes` | optional ClinicalNote — **default keep UnitView handoff notes** |
| Pending procedures | `patient.pendingProcedures` | ServiceRequest (planned) |

### New — Allergies

| UI field | UnitView target | Epic FHIR |
|----------|-----------------|-----------|
| Allergies | `patient.allergies: string[]` (or structured `{substance, criticality, reaction}[]`) | `AllergyIntolerance` for patient |

Show on: ReportSheet Clinical (or dedicated section), admit/update form, printable charge report when alerts/notes enabled.

---

## Key: bed number → Epic patient

### UnitView side

- Match key = **`roomDesignation`** (preferred) and/or numeric `bedNumber`, per unit layout.
- Occupied only when Epic has an active inpatient encounter at that location.

### Epic side (requires facility confirmation)

1. `GET Location?name={bed}` **or** hospital Location hierarchy id for the bed.
2. `GET Encounter?location={Location/id}&status=in-progress&class=IMP` (inpatient).
3. Read `Encounter.subject` → `Patient/{id}`.
4. Parallel reads: Patient, AllergyIntolerance?patient=, Flag?patient=, Condition?, NutritionOrder?, MedicationRequest?, ServiceRequest?, Observation? (per mapping table).

**Open question for facility IT:** exact Location naming vs UnitView `roomDesignation` (e.g. `Room 812` vs `812` vs `8N-812`). Need a mapping table or normalization rule.

---

## Architecture (required)

```
UnitView Electron (UI)
    → IPC / HTTPS
Backend proxy (secrets never in renderer)
    → OAuth2 / SMART Backend Services or user-context SMART
    → Epic FHIR R4
```

- Do **not** embed Epic client secret in the Electron renderer.
- Cache per bed with TTL; manual **Refresh from Epic** on ReportSheet.
- Offline: last-synced snapshot on the local patient record + `lastEpicSyncAt`.

---

## Phased delivery

| Phase | Scope | Epic needed? |
|-------|--------|--------------|
| **A** | Add `allergies` to model, form, ReportSheet, printable charge | No |
| **B** | FHIR client stub + Location→Encounter→Patient by bed; map demographics + allergies | Sandbox credentials |
| **C** | Map clinical flags / diet / mobility / LDAs as facility confirms terminology | Production app + mapping workshop |

---

## Blockers (must provide before Phase B codes against live Epic)

1. FHIR base URL (sandbox + prod)
2. SMART / Backend Services Client ID + auth method
3. Scopes: `patient/*.read`, `user/Encounter.read`, `user/Location.read`, `user/AllergyIntolerance.read`, …
4. Bed ↔ Location naming convention for one pilot unit
5. Which optional clinical items are available as FHIR vs flowsheet-only

---

## Acceptance (Phase A — allergies)

- [ ] Allergies editable on admit/update
- [ ] Visible on Charge Nurse Report (room click)
- [ ] Visible on printable charge report
- [ ] Empty state: “No known allergies” / “None recorded”

## Acceptance (Phase B — Epic by bed)

- [ ] Given bed/Location match, vacant room becomes occupied with Epic demographics
- [ ] Allergies from `AllergyIntolerance` on ReportSheet
- [ ] Admit/EDD from Encounter where present
- [ ] Staff assignments unchanged by sync
- [ ] Documented mapping + known gaps for unmapped clinical chips
