
export type MobilityStatus = 'Bed Rest' | 'Assisted' | 'Independent';
export type PatientGender = 'Male' | 'Female';
export type CodeStatus = 'Full Code' | 'DNR' | 'DNI' | 'DNR/DNI';
export type LayoutName = string;
export type OrientationStatus = 'x1' | 'x2' | 'x3' | 'x4' | 'N/A';
export type StaffRole = 'Staff Nurse' | 'Charge Nurse' | 'Float Pool Nurse' | 'Unit Clerk' | 'Patient Care Tech' | 'Sitter';
export type UnitType = 'ICU' | 'Med-Surg' | 'Telemetry' | 'Step-Down' | 'ER' | 'Other';


export interface Patient {
  id: string;
  bedNumber: number; // internal unique id for the room/slot
  roomDesignation: string; // user-facing name for the room, e.g., "Bed 101" or "Trauma 1"
  name: string;
  age: number;
  gender?: PatientGender;
  admitDate: Date;
  dischargeDate: Date; // This is EDD
  chiefComplaint: string;
  ldas: string[]; // Lines, Drains, Airways
  diet: string;
  mobility: MobilityStatus;
  codeStatus: CodeStatus;
  orientationStatus: OrientationStatus;
  assignedNurse?: string;
  /** Nurse assigned at end of previous shift / last save snapshot. */
  priorShiftNurse?: string;
  /** PCT assigned at end of previous shift / last save snapshot. */
  priorShiftTech?: string;
  isFallRisk: boolean;
  isSeizureRisk: boolean;
  isAspirationRisk: boolean;
  isIsolation: boolean;
  isInRestraints: boolean;
  isComfortCareDNR: boolean;
  /** Georgia involuntary hold (1013 / 2013) — auto-requires sitter when set. */
  isInvoluntaryHold1013?: boolean;
  /** 1:1 sitter needed for safety or behavioral reasons. */
  requiresSitter?: boolean;
  isBlocked?: boolean;
  /** General clinical / handoff notes. */
  notes?: string;
  /** Pending procedures, consults, and treatments (separate from notes). */
  pendingProcedures?: string;
  /** Discharged clinically but room not yet vacated — awaiting transport. */
  awaitingTransport?: boolean;
  /** Known allergies (from form or Epic AllergyIntolerance). */
  allergies?: string[];
  /** Epic FHIR Patient id when synced from EHR. */
  epicPatientId?: string;
  /** Epic FHIR Encounter id for the active inpatient stay. */
  epicEncounterId?: string;
  /** ISO timestamp of last successful Epic sync. */
  lastEpicSyncAt?: string;
  gridRow: number; // 1-indexed
  gridColumn: number; // 1-indexed
  fhirPatientId?: string;
  fhirEncounterId?: string;
  mrn?: string;
  fhirStale?: boolean;
  lastFhirSyncAt?: string;
}

export interface UserPreferences {
    lastSelectedLayout: LayoutName;
    isLayoutLocked: boolean;
}

export interface AssignmentSet {
    id: string; // e.g., `North-South-View-2024-07-21-Day`
    layoutName: LayoutName;
    shift: 'Day Shift' | 'Night Shift';
    date: Date;
    chargeNurseName: string;
    assignments: {
        nurseId: string;
        nurseName: string;
        spectra: string;
        assignedPatients: {
            patientId: string;
            roomDesignation: string;
            patientName: string;
        }[];
    }[];
}

export interface UnitLayoutMetadata {
  numRooms: number;
  bedsPerRoom: number;
  baselineNursesPerShift: number;
  baselinePctsPerShift: number;
  nurseToPatientRatio: number;
  unitType: UnitType;
  printLayoutOptions?: PrintLayoutOptions;
  /** PROP-4 Progressive presentation. Optional — Command surface does not need it. */
  progressiveView?: {
    preferredMode: 'command' | 'progressive';
    templateId: 'straight' | 'l' | 'u' | 't' | 'racetrack';
    paintCells: { row: number; col: number }[];
    roomPins: { patientId: string; row: number; col: number }[];
    hallwayCols?: number;
    hallwayRows?: number;
    segments?: {
      id: string;
      kind: 'straight3' | 'straight5' | 'corner' | 'tee' | 'cross' | 'wire';
      row: number;
      col: number;
      orientation: 0 | 90 | 180 | 270;
    }[];
  };
}

/** What each draggable item on the new-unit layout map represents */
export type LayoutCardKind = 'Room' | 'Staff Nurse' | 'Patient Care Tech' | 'Unit Clerk';

export interface LayoutCardPlacement {
  id: string;
  kind: LayoutCardKind;
  /** 1-based room index when kind is Room */
  roomIndex?: number;
  row: number;
  column: number;
}

export type PrintableCardType = 'Staff Nurse' | 'Patient Care Tech' | 'Unit Clerk' | 'Charge Nurse';
export type PrintableInfoField =
  | 'Name'
  | 'Role'
  | 'Assigned Rooms'
  | 'Spectra'
  | 'Assignment Group'
  | 'Relief'
  | 'Notes';

export interface PrintLayoutOptions {
  includedCardTypes: PrintableCardType[];
  includedInfoFields: PrintableInfoField[];
}

export interface CreateUnitPayload extends UnitLayoutMetadata {
  designation: string;
  cardPlacements: LayoutCardPlacement[];
  /** Building room number for each 1-based room index (same order as room cards 1..numRooms) */
  roomDisplayNumbers: number[];
}
