import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLastUpdated } from '../scripts/lib/state.js';

test('resolveLastUpdated advances when new items exist', () => {
  const now = '2026-02-17T20:00:00.000Z';
  const previous = '2026-02-10T06:00:00.000Z';
  assert.equal(resolveLastUpdated(previous, 3, now), now);
});

test('resolveLastUpdated preserves previous when no new items', () => {
  const now = '2026-02-17T20:00:00.000Z';
  const previous = '2026-02-10T06:00:00.000Z';
  assert.equal(resolveLastUpdated(previous, 0, now), previous);
});

test('resolveLastUpdated uses now when no previous timestamp exists', () => {
  const now = '2026-02-17T20:00:00.000Z';
  assert.equal(resolveLastUpdated(undefined, 0, now), now);
});
