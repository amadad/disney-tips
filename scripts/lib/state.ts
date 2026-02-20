export function resolveLastUpdated(previousLastUpdated: string | null | undefined, newItemCount: number, nowIso = new Date().toISOString()): string {
  return newItemCount > 0 ? nowIso : (previousLastUpdated ?? nowIso);
}
