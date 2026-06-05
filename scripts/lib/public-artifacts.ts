import { chmodSync, writeFileSync } from 'fs';

export const PUBLIC_ARTIFACT_MODE = 0o644;

export function writePublicArtifactSync(path: string, data: string | Buffer): void {
  writeFileSync(path, data, { mode: PUBLIC_ARTIFACT_MODE });
  chmodSync(path, PUBLIC_ARTIFACT_MODE);
}

export function ensurePublicArtifactModeSync(path: string): void {
  chmodSync(path, PUBLIC_ARTIFACT_MODE);
}
