import { chmodSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

export const PUBLIC_ARTIFACT_MODE = 0o644;
export const PUBLIC_DIRECTORY_MODE = 0o755;

export function writePublicArtifactSync(path: string, data: string | Buffer): void {
  writeFileSync(path, data, { mode: PUBLIC_ARTIFACT_MODE });
  chmodSync(path, PUBLIC_ARTIFACT_MODE);
}

export function ensurePublicArtifactModeSync(path: string): void {
  chmodSync(path, PUBLIC_ARTIFACT_MODE);
}

export function ensurePublicTreeModeSync(path: string): void {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    chmodSync(path, PUBLIC_DIRECTORY_MODE);
    for (const entry of readdirSync(path)) {
      ensurePublicTreeModeSync(join(path, entry));
    }
    return;
  }

  if (stats.isFile()) {
    chmodSync(path, PUBLIC_ARTIFACT_MODE);
  }
}
