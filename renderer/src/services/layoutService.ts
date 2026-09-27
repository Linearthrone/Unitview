import { getDb } from '../lib/database-simple';
import type {
  LayoutName,
  UserPreferences,
  AssignmentSet,
  CreateUnitPayload,
  UnitLayoutMetadata,
  UnitType,
  LayoutCardPlacement,
  PrintLayoutOptions,
  PrintableCardType,
  PrintableInfoField,
} from '../types/patient';
import type { Nurse } from '@/types/nurse';
import type { Patient } from '@/types/patient';
import type { PatientCareTech } from '@/types/nurse';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from '../lib/grid-utils';
import { sanitizeProgressiveView, type ProgressiveViewState } from '../lib/progressive-view';

const DEFAULT_LAYOUT_METADATA: UnitLayoutMetadata = {
  numRooms: 24,
  bedsPerRoom: 1,
  baselineNursesPerShift: 6,
  baselinePctsPerShift: 2,
  nurseToPatientRatio: 4,
  unitType: 'Med-Surg',
  printLayoutOptions: {
    includedCardTypes: ['Staff Nurse', 'Patient Care Tech', 'Unit Clerk', 'Charge Nurse'],
    includedInfoFields: ['Name', 'Role', 'Assigned Rooms'],
  },
};

const UNIT_TYPE_VALUES: UnitType[] = ['ICU', 'Med-Surg', 'Telemetry', 'Step-Down', 'ER', 'Other'];
const PRINTABLE_CARD_TYPES: PrintableCardType[] = ['Staff Nurse', 'Patient Care Tech', 'Unit Clerk', 'Charge Nurse'];
const PRINTABLE_INFO_FIELDS: PrintableInfoField[] = [
  'Name',
  'Role',
  'Assigned Rooms',
  'Spectra',
  'Assignment Group',
  'Relief',
  'Notes',
];

export async function getUserPreferences(): Promise<UserPreferences> {
  const db = await getDb();
  const lastSelectedLayout = (db.getUserPreference('lastSelectedLayout') || 'North-South View') as LayoutName;
  const isLayoutLocked = db.getUserPreference('isLayoutLocked') === 'true';

  return {
    lastSelectedLayout,
    isLayoutLocked,
  };
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  try {
    const db = await getDb();
    db.setUserPreference('lastSelectedLayout', preferences.lastSelectedLayout);
    db.setUserPreference('isLayoutLocked', preferences.isLayoutLocked.toString());
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

export async function getAvailableLayouts(): Promise<LayoutName[]> {
  const db = await getDb();
  return db.getAvailableLayouts();
}

export async function createLayout(layoutName: LayoutName): Promise<void> {
  try {
    const db = await getDb();
    db.createLayout(layoutName);
  } catch (error) {
    // Layout might already exist, which is fine
    console.error('Error creating layout (might already exist):', error);
  }
}

export async function deleteLayout(layoutName: LayoutName): Promise<void> {
  try {
    const db = await getDb();
    db.deleteLayout(layoutName);
  } catch (error) {
    console.error('Error deleting layout:', error);
  }
}

export async function renameLayout(oldLayoutName: LayoutName, newLayoutName: LayoutName): Promise<void> {
  const trimmedOld = oldLayoutName.trim();
  const trimmedNew = newLayoutName.trim();
  if (!trimmedOld || !trimmedNew) {
    throw new Error('Layout name cannot be empty.');
  }
  if (trimmedOld === trimmedNew) return;

  const db = await getDb();
  const existingLayouts = db.getAvailableLayouts();
  if (!existingLayouts.includes(trimmedOld)) {
    throw new Error(`Layout "${trimmedOld}" does not exist.`);
  }
  if (existingLayouts.includes(trimmedNew)) {
    throw new Error(`Layout "${trimmedNew}" already exists.`);
  }

  const oldLayoutMeta = db.getLayout(trimmedOld);
  const oldPatients = db.getPatients(trimmedOld);
  const oldNurses = db.getNurses(trimmedOld);
  const oldTechs = db.getTechs(trimmedOld);
  const oldAssignmentSets = db.getAssignmentSets(trimmedOld);

  db.createLayout(trimmedNew);
  if (oldLayoutMeta) {
    db.setLayoutMetadata(trimmedNew, sanitizeMetadata(oldLayoutMeta));
  }

  db.savePatients(trimmedNew, oldPatients);
  db.saveNurses(trimmedNew, oldNurses);
  db.saveTechs(trimmedNew, oldTechs);

  oldAssignmentSets.forEach((assignment) => {
    db.saveAssignmentSet({
      ...assignment,
      id: `${trimmedNew}-${assignment.shift}-${new Date(assignment.date).toISOString()}`,
      layoutName: trimmedNew,
    });
  });

  db.deleteLayout(trimmedOld);

  if (db.getUserPreference('lastSelectedLayout') === trimmedOld) {
    db.setUserPreference('lastSelectedLayout', trimmedNew);
  }
}

export async function saveAssignmentSet(assignmentSet: AssignmentSet): Promise<void> {
  try {
    const db = await getDb();
    db.saveAssignmentSet(assignmentSet);
  } catch (error) {
    console.error('Error saving assignment set:', error);
  }
}

export async function getAssignmentSets(layoutName: LayoutName): Promise<AssignmentSet[]> {
  try {
    const db = await getDb();
    const rows = db.getAssignmentSets(layoutName);
    return [...rows].sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Error fetching assignment sets:', error);
    return [];
  }
}

export async function deleteAssignmentSet(id: string): Promise<void> {
  try {
    const db = await getDb();
    db.deleteAssignmentSet(id);
  } catch (error) {
    console.error('Error deleting assignment set:', error);
  }
}

export async function setUserPreference(key: string, value: string | boolean): Promise<void> {
  const db = await getDb();
  db.setUserPreference(key, String(value));
}

export async function createNewUnitLayout(payload: CreateUnitPayload): Promise<void> {
  const { designation } = payload;
  const db = await getDb();
  db.createLayout(designation);
  db.setLayoutMetadata(designation, sanitizeMetadata(payload));
}

function mapCardPlacement(placement: LayoutCardPlacement): { gridRow: number; gridColumn: number } {
  return {
    gridRow: Math.max(1, Math.min(NUM_ROWS_GRID, placement.row)),
    gridColumn: Math.max(1, Math.min(NUM_COLS_GRID, placement.column)),
  };
}

function emptyNurseSlots(ratio: number): (string | null)[] {
  return Array(Math.max(1, ratio)).fill(null);
}

/** Creates layout metadata, room patients from placements, staff nurses, PCTs, unit clerk, and persists. */
export async function createFullUnitFromPayload(data: CreateUnitPayload): Promise<void> {
  if (!Array.isArray(data.roomDisplayNumbers) || data.roomDisplayNumbers.length !== data.numRooms) {
    throw new Error('Room numbering must provide exactly one number per room.');
  }

  await createNewUnitLayout(data);

  const roomPlacements = data.cardPlacements
    .filter((p): p is LayoutCardPlacement & { roomIndex: number } => p.kind === 'Room' && typeof p.roomIndex === 'number')
    .sort((a, b) => a.roomIndex - b.roomIndex);

  if (roomPlacements.length !== data.numRooms) {
    throw new Error(`Place all ${data.numRooms} room cards on the map (found ${roomPlacements.length}).`);
  }
  const seenRooms = new Set(roomPlacements.map(p => p.roomIndex));
  if (seenRooms.size !== data.numRooms) {
    throw new Error('Each room card must have a unique room number.');
  }
  for (let i = 1; i <= data.numRooms; i++) {
    if (!seenRooms.has(i)) {
      throw new Error(`Missing placement for Room ${i}.`);
    }
  }

  const nursePlacements = data.cardPlacements.filter(p => p.kind === 'Staff Nurse');
  const pctPlacements = data.cardPlacements.filter(p => p.kind === 'Patient Care Tech');
  const clerkPlacements = data.cardPlacements.filter(p => p.kind === 'Unit Clerk');

  if (nursePlacements.length !== data.baselineNursesPerShift) {
    throw new Error(`Place all ${data.baselineNursesPerShift} nurse assignment cards (found ${nursePlacements.length}).`);
  }
  if (pctPlacements.length !== data.baselinePctsPerShift) {
    throw new Error(`Place all ${data.baselinePctsPerShift} PCT cards (found ${pctPlacements.length}).`);
  }
  if (clerkPlacements.length !== 1) {
    throw new Error('Place exactly one Unit Clerk card on the map.');
  }

  const displayForIndex = (roomIndex: number): number => {
    const n = data.roomDisplayNumbers[roomIndex - 1];
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      throw new Error(`Missing room display number for room ${roomIndex}.`);
    }
    return n;
  };

  const newRooms: Patient[] = roomPlacements.map((placement) => {
    const mapped = mapCardPlacement(placement);
    const idx = placement.roomIndex;
    const displayNum = displayForIndex(idx);
    return {
      id: `room-${data.designation.replace(/\s+/g, '-').toLowerCase()}-${idx}`,
      bedNumber: displayNum,
      roomDesignation: `Room ${displayNum}`,
      name: 'Vacant',
      age: 0,
      admitDate: new Date(),
      dischargeDate: new Date(),
      chiefComplaint: 'N/A',
      ldas: [],
      diet: 'N/A',
      mobility: 'Independent',
      codeStatus: 'Full Code',
      orientationStatus: 'N/A',
      isFallRisk: false,
      isSeizureRisk: false,
      isAspirationRisk: false,
      isIsolation: false,
      isInRestraints: false,
      isComfortCareDNR: false,
      isBlocked: false,
      gridRow: mapped.gridRow,
      gridColumn: mapped.gridColumn,
    };
  });

  const staffNurses: Nurse[] = nursePlacements.map((placement, index) => {
    const mapped = mapCardPlacement(placement);
    return {
      id: `nurse-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `RN ${index + 1}`,
      role: 'Staff Nurse',
      spectra: '',
      relief: '',
      assignedPatientIds: emptyNurseSlots(data.nurseToPatientRatio),
      gridRow: mapped.gridRow,
      gridColumn: mapped.gridColumn,
    };
  });

  const unitClerkNurses: Nurse[] = clerkPlacements.map((placement) => {
    const mapped = mapCardPlacement(placement);
    return {
      id: `unit-clerk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'Unit Clerk',
      role: 'Unit Clerk',
      spectra: '',
      relief: '',
      assignedPatientIds: emptyNurseSlots(data.nurseToPatientRatio),
      gridRow: mapped.gridRow,
      gridColumn: mapped.gridColumn,
    };
  });

  const seedNurses: Nurse[] = [...staffNurses, ...unitClerkNurses];

  const seedTechs: PatientCareTech[] = pctPlacements.map((placement, index) => {
    const mapped = mapCardPlacement(placement);
    return {
      id: `tech-${index + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `PCT ${index + 1}`,
      spectra: '',
      assignmentGroup: '',
      gridRow: mapped.gridRow,
      gridColumn: mapped.gridColumn,
    };
  });

  await saveNewLayout(data.designation, newRooms, seedNurses, seedTechs);
  await setUserPreference('lastSelectedLayout', data.designation);
}

export async function saveNewLayout(
  layoutName: LayoutName,
  patients: Patient[],
  nurses: Nurse[],
  techs: PatientCareTech[]
): Promise<void> {
  const db = await getDb();
  db.createLayout(layoutName);
  db.savePatients(layoutName, patients);
  db.saveNurses(layoutName, nurses);
  db.saveTechs(layoutName, techs);
}

export async function getLayoutMetadata(layoutName: LayoutName): Promise<UnitLayoutMetadata> {
  const db = await getDb();
  const metadata = db.getLayout(layoutName);
  const defaultPrint = DEFAULT_LAYOUT_METADATA.printLayoutOptions!;
  const incomingPrint = metadata?.printLayoutOptions;
  const printLayoutOptions: PrintLayoutOptions = {
    includedCardTypes: Array.isArray(incomingPrint?.includedCardTypes)
      ? incomingPrint.includedCardTypes.filter((x): x is PrintableCardType => PRINTABLE_CARD_TYPES.includes(x as PrintableCardType))
      : defaultPrint.includedCardTypes,
    includedInfoFields: Array.isArray(incomingPrint?.includedInfoFields)
      ? incomingPrint.includedInfoFields.filter((x): x is PrintableInfoField => PRINTABLE_INFO_FIELDS.includes(x as PrintableInfoField))
      : defaultPrint.includedInfoFields,
  };
  return {
    numRooms: metadata?.numRooms ?? DEFAULT_LAYOUT_METADATA.numRooms,
    bedsPerRoom: metadata?.bedsPerRoom ?? DEFAULT_LAYOUT_METADATA.bedsPerRoom,
    baselineNursesPerShift: metadata?.baselineNursesPerShift ?? DEFAULT_LAYOUT_METADATA.baselineNursesPerShift,
    baselinePctsPerShift: metadata?.baselinePctsPerShift ?? DEFAULT_LAYOUT_METADATA.baselinePctsPerShift,
    nurseToPatientRatio: metadata?.nurseToPatientRatio ?? DEFAULT_LAYOUT_METADATA.nurseToPatientRatio,
    unitType: metadata?.unitType && UNIT_TYPE_VALUES.includes(metadata.unitType) ? metadata.unitType : DEFAULT_LAYOUT_METADATA.unitType,
    progressiveView: sanitizeProgressiveView(metadata?.progressiveView),
    printLayoutOptions: {
      includedCardTypes: printLayoutOptions.includedCardTypes.length
        ? printLayoutOptions.includedCardTypes
        : defaultPrint.includedCardTypes,
      includedInfoFields: printLayoutOptions.includedInfoFields.length
        ? printLayoutOptions.includedInfoFields
        : defaultPrint.includedInfoFields,
    },
  };
}

function sanitizeMetadata(input: Partial<UnitLayoutMetadata>): UnitLayoutMetadata {
  const defaultPrint = DEFAULT_LAYOUT_METADATA.printLayoutOptions!;
  const incomingPrint = input.printLayoutOptions;
  const includedCardTypes = Array.isArray(incomingPrint?.includedCardTypes)
    ? incomingPrint.includedCardTypes.filter((x): x is PrintableCardType => PRINTABLE_CARD_TYPES.includes(x as PrintableCardType))
    : defaultPrint.includedCardTypes;
  const includedInfoFields = Array.isArray(incomingPrint?.includedInfoFields)
    ? incomingPrint.includedInfoFields.filter((x): x is PrintableInfoField => PRINTABLE_INFO_FIELDS.includes(x as PrintableInfoField))
    : defaultPrint.includedInfoFields;

  return {
    numRooms: Math.max(1, Number(input.numRooms ?? DEFAULT_LAYOUT_METADATA.numRooms)),
    bedsPerRoom: Math.max(1, Number(input.bedsPerRoom ?? DEFAULT_LAYOUT_METADATA.bedsPerRoom)),
    baselineNursesPerShift: Math.max(0, Number(input.baselineNursesPerShift ?? DEFAULT_LAYOUT_METADATA.baselineNursesPerShift)),
    baselinePctsPerShift: Math.max(0, Number(input.baselinePctsPerShift ?? DEFAULT_LAYOUT_METADATA.baselinePctsPerShift)),
    nurseToPatientRatio: Math.max(1, Number(input.nurseToPatientRatio ?? DEFAULT_LAYOUT_METADATA.nurseToPatientRatio)),
    unitType: input.unitType && UNIT_TYPE_VALUES.includes(input.unitType) ? input.unitType : DEFAULT_LAYOUT_METADATA.unitType,
    progressiveView: sanitizeProgressiveView(input.progressiveView),
    printLayoutOptions: {
      includedCardTypes: includedCardTypes.length ? includedCardTypes : defaultPrint.includedCardTypes,
      includedInfoFields: includedInfoFields.length ? includedInfoFields : defaultPrint.includedInfoFields,
    },
  };
}

export async function saveProgressiveView(
  layoutName: LayoutName,
  state: ProgressiveViewState,
): Promise<void> {
  const db = await getDb();
  const current = await getLayoutMetadata(layoutName);
  db.setLayoutMetadata(layoutName, sanitizeMetadata({
    ...current,
    progressiveView: sanitizeProgressiveView(state),
  }));
  await db.flushPendingWrites();
}