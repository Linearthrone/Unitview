import type { Patient } from '../types/patient';
import { NUM_COLS_GRID, NUM_ROWS_GRID } from './grid-utils';

export const HALLWAY_COLS = 12;
export const HALLWAY_ROWS = 8;

export type CorridorTemplateId = 'straight' | 'l' | 'u' | 't' | 'racetrack';
export type UnitBoardViewMode = 'command' | 'progressive';
export type HallSegmentKind = 'straight3' | 'straight5' | 'corner' | 'tee' | 'cross';
export type HallOrientation = 0 | 90 | 180 | 270;

export const HALL_SEGMENT_KINDS: { id: HallSegmentKind; label: string }[] = [
  { id: 'straight3', label: 'Straight 3' },
  { id: 'straight5', label: 'Straight 5' },
  { id: 'corner', label: 'Corner' },
  { id: 'tee', label: 'T' },
  { id: 'cross', label: 'Cross' },
];

export const HALL_ORIENTATIONS: HallOrientation[] = [0, 90, 180, 270];

export interface ProgressivePaintCell {
  row: number;
  col: number;
}

export interface HallSegment {
  id: string;
  kind: HallSegmentKind;
  row: number;
  col: number;
  orientation: HallOrientation;
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
  /** Premade hall pieces. When present, paintCells is derived from these. */
  segments: HallSegment[];
}

export const DEFAULT_PROGRESSIVE_VIEW: ProgressiveViewState = {
  preferredMode: 'command',
  templateId: 'racetrack',
  paintCells: [],
  roomPins: [],
  segments: [],
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

function rotateOffset(dr: number, dc: number, orientation: HallOrientation): { dr: number; dc: number } {
  switch (orientation) {
    case 0:
      return { dr, dc };
    case 90:
      return { dr: dc, dc: -dr };
    case 180:
      return { dr: -dr, dc: -dc };
    case 270:
      return { dr: -dc, dc: dr };
    default: {
      const _never: never = orientation;
      return _never;
    }
  }
}

function baseOffsets(kind: HallSegmentKind): { dr: number; dc: number }[] {
  switch (kind) {
    case 'straight3':
      return [
        { dr: 0, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 0, dc: 2 },
      ];
    case 'straight5':
      return [
        { dr: 0, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 0, dc: 2 },
        { dr: 0, dc: 3 },
        { dr: 0, dc: 4 },
      ];
    case 'corner':
      return [
        { dr: 0, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 0, dc: 2 },
        { dr: 1, dc: 0 },
        { dr: 2, dc: 0 },
      ];
    case 'tee':
      return [
        { dr: 0, dc: -2 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 0, dc: 2 },
        { dr: 1, dc: 0 },
        { dr: 2, dc: 0 },
      ];
    case 'cross':
      return [
        { dr: 0, dc: -2 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 0, dc: 2 },
        { dr: -2, dc: 0 },
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 2, dc: 0 },
      ];
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function nextHallOrientation(orientation: HallOrientation): HallOrientation {
  switch (orientation) {
    case 0:
      return 90;
    case 90:
      return 180;
    case 180:
      return 270;
    case 270:
      return 0;
    default: {
      const _never: never = orientation;
      return _never;
    }
  }
}

export function newHallSegmentId(): string {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function segmentOffsets(
  kind: HallSegmentKind,
  orientation: HallOrientation,
): { dr: number; dc: number }[] {
  return baseOffsets(kind).map((offset) => rotateOffset(offset.dr, offset.dc, orientation));
}

export function cellsForSegment(segment: HallSegment): ProgressivePaintCell[] {
  return segmentOffsets(segment.kind, segment.orientation).map((offset) => ({
    row: segment.row + offset.dr,
    col: segment.col + offset.dc,
  }));
}

export function segmentFits(kind: HallSegmentKind, row: number, col: number, orientation: HallOrientation): boolean {
  return segmentOffsets(kind, orientation).every((offset) => inHallway(row + offset.dr, col + offset.dc));
}

export function paintFromSegments(segments: HallSegment[]): ProgressivePaintCell[] {
  const cells: ProgressivePaintCell[] = [];
  const seen = new Set<string>();
  for (const segment of segments) {
    for (const cell of cellsForSegment(segment)) {
      addCell(cells, seen, cell.row, cell.col);
    }
  }
  return cells;
}

export function resolvePaintCells(state: Pick<ProgressiveViewState, 'segments' | 'paintCells' | 'templateId'>): ProgressivePaintCell[] {
  if (state.segments.length > 0) return paintFromSegments(state.segments);
  if (state.paintCells.length > 0) return state.paintCells;
  return buildTemplatePaint(state.templateId || 'racetrack');
}

export function segmentCoveringCell(segments: HallSegment[], row: number, col: number): HallSegment | undefined {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (!segment) continue;
    if (cellsForSegment(segment).some((cell) => cell.row === row && cell.col === col)) {
      return segment;
    }
  }
  return undefined;
}

export function placeHallSegment(
  state: ProgressiveViewState,
  kind: HallSegmentKind,
  row: number,
  col: number,
  orientation: HallOrientation,
): ProgressiveViewState {
  if (!segmentFits(kind, row, col, orientation)) return state;
  const segments = [
    ...state.segments,
    { id: newHallSegmentId(), kind, row, col, orientation },
  ];
  return {
    ...state,
    segments,
    paintCells: paintFromSegments(segments),
  };
}

export function moveHallSegment(
  state: ProgressiveViewState,
  segmentId: string,
  row: number,
  col: number,
): ProgressiveViewState {
  const current = state.segments.find((segment) => segment.id === segmentId);
  if (!current || !segmentFits(current.kind, row, col, current.orientation)) return state;
  const segments = state.segments.map((segment) =>
    segment.id === segmentId ? { ...segment, row, col } : segment,
  );
  return { ...state, segments, paintCells: paintFromSegments(segments) };
}

export function rotateHallSegment(state: ProgressiveViewState, segmentId: string): ProgressiveViewState {
  const current = state.segments.find((segment) => segment.id === segmentId);
  if (!current) return state;
  const orientation = nextHallOrientation(current.orientation);
  if (!segmentFits(current.kind, current.row, current.col, orientation)) return state;
  const segments = state.segments.map((segment) =>
    segment.id === segmentId ? { ...segment, orientation } : segment,
  );
  return { ...state, segments, paintCells: paintFromSegments(segments) };
}

export function removeHallSegment(state: ProgressiveViewState, segmentId: string): ProgressiveViewState {
  const segments = state.segments.filter((segment) => segment.id !== segmentId);
  return { ...state, segments, paintCells: paintFromSegments(segments) };
}

export function clearHallway(state: ProgressiveViewState): ProgressiveViewState {
  return { ...state, segments: [], paintCells: [] };
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
  const paintCells = resolvePaintCells(state);
  const knownIds = new Set(patients.map((patient) => patient.id));
  const keptPins = state.roomPins.filter((pin) => knownIds.has(pin.patientId));
  const pinnedIds = new Set(keptPins.map((pin) => pin.patientId));
  const missing = patients.filter((patient) => !pinnedIds.has(patient.id));
  const added = autoPinRooms(missing, paintCells);
  return {
    ...state,
    templateId: state.templateId || 'racetrack',
    segments: state.segments ?? [],
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
    segments: [],
  };
}

export function placeRoomPin(
  state: ProgressiveViewState,
  patientId: string,
  row: number,
  col: number,
): ProgressiveViewState {
  const snapped = nearestPaintCell(row, col, resolvePaintCells(state));
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
  const segments = Array.isArray(raw.segments)
    ? raw.segments
        .filter((segment): segment is HallSegment => {
          if (!segment || typeof segment !== 'object') return false;
          const kindOk = HALL_SEGMENT_KINDS.some((item) => item.id === segment.kind);
          const orientationOk = HALL_ORIENTATIONS.includes(segment.orientation as HallOrientation);
          return (
            kindOk &&
            orientationOk &&
            typeof segment.id === 'string' &&
            segment.id.length > 0 &&
            Number.isFinite(segment.row) &&
            Number.isFinite(segment.col) &&
            segmentFits(
              segment.kind as HallSegmentKind,
              Number(segment.row),
              Number(segment.col),
              segment.orientation as HallOrientation,
            )
          );
        })
        .map((segment) => ({
          id: segment.id,
          kind: segment.kind,
          row: Number(segment.row),
          col: Number(segment.col),
          orientation: segment.orientation,
        }))
    : [];
  return { preferredMode, templateId, paintCells, roomPins, segments };
}
