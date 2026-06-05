import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ensurePublicArtifactModeSync,
  ensurePublicTreeModeSync,
  PUBLIC_ARTIFACT_MODE,
  PUBLIC_DIRECTORY_MODE,
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

test('ensurePublicTreeModeSync repairs static build tree permissions', () => {
  const dir = mkdtempSync(join(tmpdir(), 'disney-public-tree-'));
  const assets = join(dir, 'assets');
  const html = join(dir, 'index.html');
  const js = join(assets, 'main.js');

  try {
    mkdirSync(assets, { mode: 0o700 });
    writeFileSync(html, '<html></html>', { mode: 0o600 });
    writeFileSync(js, 'console.log("ok")', { mode: 0o600 });
    chmodSync(assets, 0o700);
    chmodSync(html, 0o600);
    chmodSync(js, 0o600);

    ensurePublicTreeModeSync(dir);

    assert.equal(statSync(dir).mode & 0o777, PUBLIC_DIRECTORY_MODE);
    assert.equal(statSync(assets).mode & 0o777, PUBLIC_DIRECTORY_MODE);
    assert.equal(statSync(html).mode & 0o777, PUBLIC_ARTIFACT_MODE);
    assert.equal(statSync(js).mode & 0o777, PUBLIC_ARTIFACT_MODE);
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
