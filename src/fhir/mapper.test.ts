import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSandboxContexts } from './sandbox-fixtures';
import {
  calculateAgeYears,
  extractRoomHint,
  formatPatientName,
  mapCodeStatus,
  mapPatientToCensus,
} from './mapper';

test('formats official names and room hints', () => {
  assert.equal(formatPatientName([{ use: 'official', family: 'Lopez', given: ['Camila'] }]), 'Camila Lopez');
  assert.equal(
    extractRoomHint({
      resourceType: 'Encounter',
      location: [{ location: { display: 'EMC IP Room 812' } }],
    }),
    'EMC IP Room 812'
  );
});

test('calculates age from a birth date without local timezone drift', () => {
  const now = new Date(Date.UTC(2026, 7, 29));
  assert.equal(calculateAgeYears('1987-04-12', now), 39);
  assert.equal(calculateAgeYears('1987-08-30', now), 38);
});

test('maps code status phrases', () => {
  assert.equal(mapCodeStatus('Full code, no restrictions'), 'Full Code');
  assert.equal(mapCodeStatus('DNR / Comfort care'), 'DNR');
  assert.equal(mapCodeStatus('DNR/DNI documented'), 'DNR/DNI');
});

test('maps Epic-shaped sandbox patients into census records', () => {
  const now = new Date(Date.UTC(2026, 7, 29));
  const records = buildSandboxContexts().map((ctx) => mapPatientToCensus(ctx, { now }));
  assert.equal(records.length, 40);

  const camila = records.find((r) => r.mrn === '203713');
  assert.ok(camila);
  assert.equal(camila.name, 'Camila Lopez');
  assert.equal(camila.gender, 'Female');
  assert.equal(camila.age, 39);
  assert.equal(camila.roomHint, 'Room 812');
  assert.equal(camila.chiefComplaint, 'Community-acquired pneumonia');
  assert.equal(camila.diet, 'Cardiac, thin liquids');
  assert.equal(camila.isFallRisk, true);
  assert.deepEqual(camila.ldas, ['Foley']);

  const derrick = records.find((r) => r.mrn === '202916');
  assert.ok(derrick);
  assert.equal(derrick.isIsolation, true);
  assert.equal(derrick.mobility, 'Assisted');

  const elijah = records.find((r) => r.mrn === '202540');
  assert.ok(elijah);
  assert.equal(elijah.codeStatus, 'DNR');
  assert.equal(elijah.isComfortCareDNR, true);
  assert.ok(elijah.notes?.includes('Penicillin'));
});
