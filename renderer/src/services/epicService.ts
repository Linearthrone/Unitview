/**
 * Epic FHIR field map (Unitview Charge Nurse Report)
 *
 * Live wiring (Phase B.1) — Location → Encounter → Patient, then:
 * | Unitview field           | FHIR resource / path                          |
 * |--------------------------|-----------------------------------------------|
 * | name                     | Patient.name                                  |
 * | age                      | Patient.birthDate (derived)                   |
 * | gender                   | Patient.gender                                |
 * | admitDate                | Encounter.period.start                        |
 * | dischargeDate (EDD)      | facility AnticipatedDischarge / Observation   |
 * | chiefComplaint           | Encounter.reasonCode / Condition              |
 * | allergies[]              | AllergyIntolerance.patient                    |
 * | diet                     | NutritionOrder                                |
 * | mobility / orientation   | Observation (facility codes)                  |
 * | ldas[]                   | Device / Procedure / flowsheet                |
 * | isolation/restraints/…   | Flag / Observation                            |
 * | codeStatus               | Consent / Observation                         |
 * | pendingProcedures        | ServiceRequest                                |
 * | assignedNurse / PCT      | Unitview only — never overwrite from Epic     |
 *
 * Bed key: Unitview roomDesignation → GET Location?name=… → Encounter at that location.
 */

import type { CodeStatus, MobilityStatus, OrientationStatus, Patient, PatientGender } from '@/types/patient';

export type EpicSyncSource = 'stub' | 'live';

/** Partial patient fields returned by an Epic (or stub) bed sync. Never includes nurse/PCT. */
export type EpicPatientPatch = {
  name?: string;
  age?: number;
  gender?: PatientGender;
  chiefComplaint?: string;
  admitDate?: Date;
  dischargeDate?: Date;
  diet?: string;
  mobility?: MobilityStatus;
  codeStatus?: CodeStatus;
  orientationStatus?: OrientationStatus;
  ldas?: string[];
  allergies?: string[];
  notes?: string;
  pendingProcedures?: string;
  isFallRisk?: boolean;
  isSeizureRisk?: boolean;
  isAspirationRisk?: boolean;
  isIsolation?: boolean;
  isInRestraints?: boolean;
  isComfortCareDNR?: boolean;
  isInvoluntaryHold1013?: boolean;
  requiresSitter?: boolean;
  epicPatientId?: string;
  epicEncounterId?: string;
  lastEpicSyncAt?: string;
};

export type EpicBedSyncResult =
  | { ok: true; source: EpicSyncSource; patch: EpicPatientPatch; message?: string }
  | { ok: false; source: EpicSyncSource; error: string };

function extractBedToken(roomDesignation: string, bedNumber: number): string {
  const digits = roomDesignation.match(/\d{2,4}/)?.[0];
  return digits ?? String(bedNumber);
}

/** Deterministic stub payload so demos work without Epic credentials. */
function buildStubPatch(roomDesignation: string, bedNumber: number): EpicPatientPatch {
  const bed = extractBedToken(roomDesignation, bedNumber);
  const now = new Date();
  const admit = new Date(now);
  admit.setDate(admit.getDate() - 2);
  const edd = new Date(now);
  edd.setDate(edd.getDate() + 3);

  return {
    name: `Epic Demo, Bed ${bed}`,
    age: 58 + (Number(bed) % 20),
    gender: Number(bed) % 2 === 0 ? 'Female' : 'Male',
    chiefComplaint: 'Synced from Epic stub (Location → Encounter → Patient)',
    admitDate: admit,
    dischargeDate: edd,
    diet: 'Cardiac Diet',
    mobility: 'Assisted',
    codeStatus: 'Full Code',
    orientationStatus: 'x3',
    ldas: ['PIV L FA', 'Telemetry'],
    allergies: ['Penicillin', 'Latex'],
    pendingProcedures: 'Echo, Cardiology consult',
    isFallRisk: true,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    isInvoluntaryHold1013: false,
    requiresSitter: false,
    epicPatientId: `stub-patient-${bed}`,
    epicEncounterId: `stub-encounter-${bed}`,
    lastEpicSyncAt: now.toISOString(),
  };
}

/**
 * Sync occupying patient for a unit bed from Epic FHIR.
 * Currently returns a stub adapter; wire a secure proxy when credentials exist.
 */
export async function syncBedFromEpic(
  roomDesignation: string,
  bedNumber: number,
): Promise<EpicBedSyncResult> {
  // Simulate network latency for UI feedback.
  await new Promise((r) => setTimeout(r, 350));
  return {
    ok: true,
    source: 'stub',
    patch: buildStubPatch(roomDesignation, bedNumber),
    message: 'Loaded stub Epic demographics, allergies, and clinical flags for this bed.',
  };
}

/** Merge Epic patch into a room row without touching Unitview staff assignments. */
export function applyEpicPatchToPatient(patient: Patient, patch: EpicPatientPatch): Patient {
  return {
    ...patient,
    name: patch.name ?? patient.name,
    age: patch.age ?? patient.age,
    gender: patch.gender ?? patient.gender,
    chiefComplaint: patch.chiefComplaint ?? patient.chiefComplaint,
    admitDate: patch.admitDate ?? patient.admitDate,
    dischargeDate: patch.dischargeDate ?? patient.dischargeDate,
    diet: patch.diet ?? patient.diet,
    mobility: patch.mobility ?? patient.mobility,
    codeStatus: patch.codeStatus ?? patient.codeStatus,
    orientationStatus: patch.orientationStatus ?? patient.orientationStatus,
    ldas: patch.ldas ?? patient.ldas,
    allergies: patch.allergies ?? patient.allergies,
    notes: patch.notes !== undefined ? patch.notes : patient.notes,
    pendingProcedures:
      patch.pendingProcedures !== undefined ? patch.pendingProcedures : patient.pendingProcedures,
    isFallRisk: patch.isFallRisk ?? patient.isFallRisk,
    isSeizureRisk: patch.isSeizureRisk ?? patient.isSeizureRisk,
    isAspirationRisk: patch.isAspirationRisk ?? patient.isAspirationRisk,
    isIsolation: patch.isIsolation ?? patient.isIsolation,
    isInRestraints: patch.isInRestraints ?? patient.isInRestraints,
    isComfortCareDNR: patch.isComfortCareDNR ?? patient.isComfortCareDNR,
    isInvoluntaryHold1013: patch.isInvoluntaryHold1013 ?? patient.isInvoluntaryHold1013,
    requiresSitter: patch.requiresSitter ?? patient.requiresSitter,
    epicPatientId: patch.epicPatientId ?? patient.epicPatientId,
    epicEncounterId: patch.epicEncounterId ?? patient.epicEncounterId,
    lastEpicSyncAt: patch.lastEpicSyncAt ?? patient.lastEpicSyncAt,
    awaitingTransport: false,
    isBlocked: patient.isBlocked,
    // Preserve Unitview staffing:
    // assignedNurse, priorShiftNurse, priorShiftTech unchanged
  };
}
