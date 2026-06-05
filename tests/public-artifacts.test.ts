import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ensurePublicArtifactModeSync,
  PUBLIC_ARTIFACT_MODE,
  writePublicArtifactSync,
} from '../scripts/lib/public-artifacts.js';

test('writePublicArtifactSync corrects restrictive modes on existing public files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'disney-public-artifact-'));
  const path = join(dir, 'tips.json');

  try {
    writeFileSync(path, '{"old":true}', { mode: 0o600 });
    chmodSync(path, 0o600);

    writePublicArtifactSync(path, '{"ok":true}');

    assert.equal(statSync(path).mode & 0o777, PUBLIC_ARTIFACT_MODE);
    assert.equal(readFileSync(path, 'utf-8'), '{"ok":true}');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('ensurePublicArtifactModeSync repairs mode without rewriting content', () => {
  const dir = mkdtempSync(join(tmpdir(), 'disney-public-artifact-'));
  const path = join(dir, 'embeddings.json');

  try {
    writeFileSync(path, '[1]', { mode: 0o600 });
    chmodSync(path, 0o600);

    ensurePublicArtifactModeSync(path);

    assert.equal(statSync(path).mode & 0o777, PUBLIC_ARTIFACT_MODE);
    assert.equal(readFileSync(path, 'utf-8'), '[1]');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
