import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  UPDATE_FEED,
  emptyUpdateStatus,
  isUpdateBusy,
  updateActionLabel,
} from './update-status';

test('update feed publishes from the Unitview GitHub repo', () => {
  assert.equal(UPDATE_FEED.owner, 'Linearthrone');
  assert.equal(UPDATE_FEED.repo, 'Unitview');
});

test('empty status is idle when packaged and unavailable in the browser', () => {
  const packaged = emptyUpdateStatus('5.4.1', true);
  assert.equal(packaged.phase, 'idle');
  const browser = emptyUpdateStatus('5.4.1', false);
  assert.equal(browser.phase, 'unavailable');
  assert.match(browser.message, /installed Windows app/);
});

test('action labels and busy flags cover every phase', () => {
  assert.equal(updateActionLabel('available'), 'Download update');
  assert.equal(updateActionLabel('ready'), 'Install and restart');
  assert.equal(isUpdateBusy('downloading'), true);
  assert.equal(isUpdateBusy('ready'), false);
});
