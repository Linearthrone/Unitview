import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emptyUpdateStatus,
  isUpdateBusy,
  stampedPackVersion,
  updateActionLabel,
} from './update-status';

test('stamped pack version keeps marketing major.minor and uses the CI patch', () => {
  assert.equal(stampedPackVersion('5.4.0', 12), '5.4.12');
  assert.equal(stampedPackVersion('5.3.0-c', 8), '5.3.8');
});

test('stamped pack version rejects junk', () => {
  assert.throws(() => stampedPackVersion('5.4.0', -1));
});

test('empty status is idle when packaged and unavailable in the browser', () => {
  const packaged = emptyUpdateStatus('5.4.0', true);
  assert.equal(packaged.phase, 'idle');
  const browser = emptyUpdateStatus('5.4.0', false);
  assert.equal(browser.phase, 'unavailable');
  assert.match(browser.message, /installed Windows app/);
});

test('action labels and busy flags cover every phase', () => {
  assert.equal(updateActionLabel('available'), 'Download update');
  assert.equal(updateActionLabel('ready'), 'Install and restart');
  assert.equal(isUpdateBusy('downloading'), true);
  assert.equal(isUpdateBusy('ready'), false);
});
