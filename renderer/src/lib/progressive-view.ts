import type { Patient } from '../types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from './grid-utils';

export const HALLWAY_COLS = 12;
export const HALLWAY_ROWS = 8;

export type CorridorTemplateId = 'straight' | 'l' | 'u' | 't' | 'racetrack';
export type UnitBoardViewMode = 'command' | 'progressive';

export interface ProgressivePaintCell {
  row: number;
  col: number;
}

export interface ProgressiveRoomPin {
  patientId: string;
  row: number;
  col: number;
}

export interface ProgressiveViewState {
  preferredMode: UnitBoardViewMode;
  templateId: CorridorTemplateId;
  paintCells: ProgressivePaintCell[];
  roomPins: ProgressiveRoomPin[];
}

export const DEFAULT_PROGRESSIVE_VIEW: ProgressiveViewState = {
  preferredMode: 'command',
  templateId: 'racetrack',
  paintCells: [],
  roomPins: [],
};

export const CORRIDOR_TEMPLATES: { id: CorridorTemplateId; label: string }[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'l', label: 'L-shape' },
  { id: 'u', label: 'U-shape' },
  { id: 't', label: 'T-shape' },
  { id: 'racetrack', label: 'Racetrack' },
];

export function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function inHallway(row: number, col: number): boolean {
  return row >= 1 && row <= HALLWAY_ROWS && col >= 1 && col <= HALLWAY_COLS;
}

function addCell(cells: ProgressivePaintCell[], seen: Set<string>, row: number, col: number): void {
  if (!inHallway(row, col)) return;
  const key = cellKey(row, col);
  if (seen.has(key)) return;
  seen.add(key);
  cells.push({ row, col });
}

export function buildTemplatePaint(templateId: CorridorTemplateId): ProgressivePaintCell[] {
  const cells: ProgressivePaintCell[] = [];
  const seen = new Set<string>();
  const add = (row: number, col: number) => addCell(cells, seen, row, col);

  if (templateId === 'straight') {
    for (let col = 2; col <= 11; col += 1) add(4, col);
  } else if (templateId === 'l') {
    for (let col = 2; col <= 10; col += 1) add(2, col);
    for (let row = 2; row <= 7; row += 1) add(row, 10);
  } else if (templateId === 'u') {
    for (let col = 2; col <= 10; col += 1) add(2, col);
    for (let row = 2; row <= 7; row += 1) {
      add(row, 2);
      add(row, 10);
    }
  } else if (templateId === 't') {
    for (let col = 2; col <= 10; col += 1) add(2, col);
    for (let row = 2; row <= 7; row += 1) add(row, 6);
  } else {
    for (let col = 2; col <= 10; col += 1) {
      add(2, col);
      add(7, col);
    }
    for (let row = 2; row <= 7; row += 1) {
      add(row, 2);
      add(row, 10);
    }
  }

  return cells;
}

export function togglePaintCell(
  paintCells: ProgressivePaintCell[],
  row: number,
  col: number,
): ProgressivePaintCell[] {
  if (!inHallway(row, col)) return paintCells;
  const key = cellKey(row, col);
  const exists = paintCells.some((cell) => cellKey(cell.row, cell.col) === key);
  if (exists) return paintCells.filter((cell) => cellKey(cell.row, cell.col) !== key);
  return [...paintCells, { row, col }];
}

export function mapAssignmentToHallway(gridRow: number, gridCol: number): ProgressivePaintCell {
  const row = Math.min(
    HALLWAY_ROWS,
    Math.max(1, Math.round(((gridRow - 1) / Math.max(1, NUM_ROWS_GRID - 1)) * (HALLWAY_ROWS - 1)) + 1),
  );
  const col = Math.min(
    HALLWAY_COLS,
    Math.max(1, Math.round(((gridCol - 1) / Math.max(1, NUM_COLS_GRID - 1)) * (HALLWAY_COLS - 1)) + 1),
  );
  return { row, col };
}

export function nearestPaintCell(
  row: number,
  col: number,
  paintCells: ProgressivePaintCell[],
): ProgressivePaintCell {
  if (paintCells.length === 0) return { row, col };
  let best = paintCells[0]!;
  let bestDist = Infinity;
  for (const cell of paintCells) {
    const dist = Math.abs(cell.row - row) + Math.abs(cell.col - col);
    if (dist < bestDist) {
      best = cell;
      bestDist = dist;
    }
  }
  return best;
}

export function autoPinRooms(
  patients: Patient[],
  paintCells: ProgressivePaintCell[],
): ProgressiveRoomPin[] {
  const hallway = paintCells.length > 0 ? paintCells : buildTemplatePaint('racetrack');
  return patients.map((patient) => {
    const mapped = mapAssignmentToHallway(patient.gridRow, patient.gridColumn);
    const snapped = nearestPaintCell(mapped.row, mapped.col, hallway);
    return { patientId: patient.id, row: snapped.row, col: snapped.col };
  });
}

export function ensureProgressiveGeometry(
  state: ProgressiveViewState,
  patients: Patient[],
): ProgressiveViewState {
  const paintCells =
    state.paintCells.length > 0 ? state.paintCells : buildTemplatePaint(state.templateId || 'racetrack');
  const knownIds = new Set(patients.map((patient) => patient.id));
  const keptPins = state.roomPins.filter((pin) => knownIds.has(pin.patientId));
  const pinnedIds = new Set(keptPins.map((pin) => pin.patientId));
  const missing = patients.filter((patient) => !pinnedIds.has(patient.id));
  const added = autoPinRooms(missing, paintCells);
  return {
    ...state,
    templateId: state.templateId || 'racetrack',
    paintCells,
    roomPins: [...keptPins, ...added],
  };
}

export function applyTemplate(
  templateId: CorridorTemplateId,
  patients: Patient[],
  preferredMode: UnitBoardViewMode = 'command',
): ProgressiveViewState {
  const paintCells = buildTemplatePaint(templateId);
  return {
    preferredMode,
    templateId,
    paintCells,
    roomPins: autoPinRooms(patients, paintCells),
  };
}

export function placeRoomPin(
  state: ProgressiveViewState,
  patientId: string,
  row: number,
  col: number,
): ProgressiveViewState {
  const snapped = nearestPaintCell(row, col, state.paintCells);
  return {
    ...state,
    roomPins: [
      ...state.roomPins.filter((pin) => pin.patientId !== patientId),
      { patientId, row: snapped.row, col: snapped.col },
    ],
  };
}

export function sanitizeProgressiveView(input: unknown): ProgressiveViewState {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_PROGRESSIVE_VIEW };
  }
  const raw = input as Partial<ProgressiveViewState>;
  const templateId = CORRIDOR_TEMPLATES.some((item) => item.id === raw.templateId)
    ? (raw.templateId as CorridorTemplateId)
    : DEFAULT_PROGRESSIVE_VIEW.templateId;
  const preferredMode = raw.preferredMode === 'progressive' ? 'progressive' : 'command';
  const paintCells = Array.isArray(raw.paintCells)
    ? raw.paintCells
        .filter((cell): cell is ProgressivePaintCell =>
          Boolean(cell && Number.isFinite(cell.row) && Number.isFinite(cell.col) && inHallway(cell.row, cell.col)),
        )
        .map((cell) => ({ row: Number(cell.row), col: Number(cell.col) }))
    : [];
  const roomPins = Array.isArray(raw.roomPins)
    ? raw.roomPins
        .filter((pin): pin is ProgressiveRoomPin =>
          Boolean(
            pin &&
              typeof pin.patientId === 'string' &&
              pin.patientId &&
              Number.isFinite(pin.row) &&
              Number.isFinite(pin.col) &&
              inHallway(pin.row, pin.col),
          ),
        )
        .map((pin) => ({ patientId: pin.patientId, row: Number(pin.row), col: Number(pin.col) }))
    : [];
  return { preferredMode, templateId, paintCells, roomPins };
}
