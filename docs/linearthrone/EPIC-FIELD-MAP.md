# Epic FHIR ↔ Unitview field map

Companion to `renderer/src/services/epicService.ts` and `docs/linearthrone/EPIC-BED-SYNC-BRIEF.md`.

## Resolve patient by bed

1. `GET Location?name={roomDesignation|bedToken}`
2. `GET Encounter?location=Location/{id}&status=in-progress&class=IMP`
3. `GET Patient/{Encounter.subject}`
4. Parallel: `AllergyIntolerance?patient=`, `Flag?patient=`, `Observation?patient=`, `NutritionOrder?patient=`, `Condition?patient=`, `MedicationRequest?patient=`, `ServiceRequest?patient=`, `Device?patient=` / `Procedure?patient=`, `Consent?patient=`

## ReportSheet mapping

| ReportSheet UI | Unitview property | FHIR |
|----------------|-------------------|------|
| Name | `name` | Patient.name |
| Age | `age` | Patient.birthDate |
| Gender | `gender` | Patient.gender |
| Staff (current/prior) | nurse/PCT | **Unitview only** |
| Chief complaint | `chiefComplaint` | Encounter.reasonCode / Condition |
| Admit | `admitDate` | Encounter.period.start |
| EDD | `dischargeDate` | facility extension / Observation |
| Diet | `diet` | NutritionOrder |
| Mobility | `mobility` | Observation |
| A&O | `orientationStatus` | Observation |
| LDAs | `ldas` | Device / Procedure |
| Isolation / restraints / holds / sitter | flags | Flag / Observation / ServiceRequest |
| Code / comfort | `codeStatus`, `isComfortCareDNR` | Consent / Observation |
| Fall / seizure / aspiration | booleans | Flag / RiskAssessment |
| Notes | `notes` | prefer Unitview handoff |
| Pending procedures | `pendingProcedures` | ServiceRequest |
| **Allergies** | `allergies` | AllergyIntolerance |

## Current app mode

`syncBedFromEpic()` uses a **stub** until `VITE_EPIC_FHIR_BASE` is set and the live proxy is implemented.
