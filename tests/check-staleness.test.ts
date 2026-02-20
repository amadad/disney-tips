import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, formatDays } from '../scripts/check-staleness.js';

test('parseArgs parses threshold and check-dist', () => {
  const args = parseArgs(['--threshold', '5', '--check-dist']);
  assert.equal(args.thresholdDays, 5);
  assert.equal(args.checkDist, true);
});

test('parseArgs throws on unknown flags', () => {
  assert.throws(() => parseArgs(['--wat']), /Unknown argument/);
});

test('formatDays rounds down to one decimal place', () => {
  assert.equal(formatDays(2), '2');
  assert.equal(formatDays(2.19), '2.1');
});
