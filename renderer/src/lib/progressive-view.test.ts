import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Patient } from '../types/patient';
import {
  applyTemplate,
  autoPinRooms,
  buildTemplatePaint,
  cellsForSegment,
  ensureProgressiveGeometry,
  nextHallOrientation,
  paintFromSegments,
  placeHallSegment,
  rotateHallSegment,
  sanitizeProgressiveView,
  segmentFits,
} from './progressive-view';

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 'p1',
    bedNumber: 1,
    roomDesignation: '401',
    name: 'Vacant',
    age: 0,
    admitDate: new Date('2026-09-01'),
    dischargeDate: new Date('2026-09-22'),
    chiefComplaint: '',
    ldas: [],
    diet: '',
    mobility: 'Independent',
    codeStatus: 'Full Code',
    orientationStatus: 'N/A',
    isFallRisk: false,
    isSeizureRisk: false,
    isAspirationRisk: false,
    isIsolation: false,
    isInRestraints: false,
    isComfortCareDNR: false,
    gridRow: 1,
    gridColumn: 1,
    ...overrides,
  };
}

test('racetrack template paints a closed hallway', () => {
  const cells = buildTemplatePaint('racetrack');
  assert.ok(cells.length > 8);
  assert.ok(cells.some((c) => c.row === 2 && c.col === 2));
  assert.ok(cells.some((c) => c.row === 7 && c.col === 10));
});

test('auto pins snap rooms onto the hallway', () => {
  const paint = buildTemplatePaint('straight');
  const pins = autoPinRooms(
    [
      patient({ id: 'a', gridRow: 1, gridColumn: 1 }),
      patient({ id: 'b', gridRow: 10, gridColumn: 17 }),
    ],
    paint,
  );
  assert.equal(pins.length, 2);
  for (const pin of pins) {
    assert.ok(paint.some((cell) => cell.row === pin.row && cell.col === pin.col));
  }
});

test('ensureProgressiveGeometry fills missing pins without dropping saved ones', () => {
  const paint = buildTemplatePaint('l');
  const state = ensureProgressiveGeometry(
    {
      preferredMode: 'progressive',
      templateId: 'l',
      paintCells: paint,
      roomPins: [{ patientId: 'kept', row: 2, col: 4 }],
      segments: [],
    },
    [patient({ id: 'kept', gridRow: 1, gridColumn: 4 }), patient({ id: 'new', gridRow: 8, gridColumn: 16 })],
  );
  assert.equal(state.roomPins.find((pin) => pin.patientId === 'kept')?.col, 4);
  assert.ok(state.roomPins.some((pin) => pin.patientId === 'new'));
});

test('sanitize drops unknown modes and keeps command as default', () => {
  const cleaned = sanitizeProgressiveView({ preferredMode: 'magic', templateId: 'nope', paintCells: [{ row: 99, col: 1 }] });
  assert.equal(cleaned.preferredMode, 'command');
  assert.equal(cleaned.templateId, 'racetrack');
  assert.equal(cleaned.paintCells.length, 0);
});

test('applyTemplate sets hallway and pins for every room', () => {
  const next = applyTemplate('u', [patient({ id: 'a' }), patient({ id: 'b', gridRow: 5, gridColumn: 9 })]);
  assert.equal(next.templateId, 'u');
  assert.equal(next.roomPins.length, 2);
  assert.ok(next.paintCells.length > 0);
});

test('straight hall segment rotates from east-west to north-south', () => {
  const east = cellsForSegment({ id: 's', kind: 'straight3', row: 4, col: 4, orientation: 0 });
  assert.deepEqual(east, [
    { row: 4, col: 4 },
    { row: 4, col: 5 },
    { row: 4, col: 6 },
  ]);
  const south = cellsForSegment({ id: 's', kind: 'straight3', row: 4, col: 4, orientation: 90 });
  assert.deepEqual(south, [
    { row: 4, col: 4 },
    { row: 5, col: 4 },
    { row: 6, col: 4 },
  ]);
  assert.equal(nextHallOrientation(270), 0);
});

test('corner and tee reject placements that leave the canvas', () => {
  assert.equal(segmentFits('straight5', 1, 9, 0), false);
  assert.equal(segmentFits('straight5', 1, 1, 0), true);
  assert.equal(segmentFits('tee', 1, 2, 0), false);
  assert.equal(segmentFits('cross', 4, 6, 0), true);
});

test('placed segments union into paint and rotate in place', () => {
  let state = sanitizeProgressiveView({});
  state = placeHallSegment(state, 'straight3', 3, 3, 0);
  state = placeHallSegment(state, 'corner', 3, 5, 0);
  const paint = paintFromSegments(state.segments);
  assert.ok(paint.some((cell) => cell.row === 3 && cell.col === 3));
  assert.ok(paint.some((cell) => cell.row === 5 && cell.col === 5));
  const placed = state.segments[0];
  assert.ok(placed);
  const rotated = rotateHallSegment(state, placed.id);
  assert.equal(rotated.segments[0]?.orientation, 90);
});

test('rotate that would leave the canvas is refused', () => {
  let state = sanitizeProgressiveView({});
  state = placeHallSegment(state, 'straight5', 1, 1, 90);
  const placed = state.segments[0];
  assert.ok(placed);
  assert.equal(placed.orientation, 90);
  const rotated = rotateHallSegment(state, placed.id);
  assert.equal(rotated.segments[0]?.orientation, 90);
  assert.equal(rotated, state);
});
