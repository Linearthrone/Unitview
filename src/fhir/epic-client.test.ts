import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchEpicCensus } from './epic-client';
import { EPIC_SANDBOX_DEFAULTS } from './epic-config';

test('sandbox fixture mode returns a mapped census without calling Epic', async () => {
  const result = await fetchEpicCensus({
    ...EPIC_SANDBOX_DEFAULTS,
    authMode: 'sandbox_fixtures',
  });
  assert.equal(result.source, 'sandbox_fixtures');
  assert.ok(result.records.length >= 36);
  assert.ok(result.records.every((record) => record.fhirPatientId && record.roomHint));
  assert.ok(result.records.some((record) => record.name === 'Camila Lopez'));
});
