/**
 * Post-deploy verification: checks that the live site is serving fresh data.
 * Compares local data/public/tips.json with what the live site returns.
 *
 * Usage: tsx scripts/verify-live.ts [--url <url>] [--max-drift <seconds>]
 *
 * Exit codes:
 *   0 = live site matches local data
 *   1 = mismatch (stale or unreachable)
 *   2 = usage/config error
 */

import { readFileSync } from 'fs';

const DEFAULT_URL = 'https://disney.bound.tips';
const DEFAULT_MAX_DRIFT_SECONDS = 300; // 5 minutes tolerance

interface TipsJson {
  lastUpdated: string;
  totalTips: number;
}

function parseArgs(argv: string[]) {
  let url = DEFAULT_URL;
  let maxDrift = DEFAULT_MAX_DRIFT_SECONDS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url' && argv[i + 1]) { url = argv[++i]; continue; }
    if (arg?.startsWith('--url=')) { url = arg.slice(6); continue; }
    if (arg === '--max-drift' && argv[i + 1]) { maxDrift = Number(argv[++i]); continue; }
    if (arg?.startsWith('--max-drift=')) { maxDrift = Number(arg.slice(12)); continue; }
  }

  return { url, maxDrift };
}

async function main() {
  const { url, maxDrift } = parseArgs(process.argv.slice(2));

  // Read local tips.json
  let local: TipsJson;
  try {
    local = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
  } catch {
    console.error('[verify-live] Cannot read local data/public/tips.json');
    return 2;
  }

  // Fetch live tips.json
  let live: TipsJson;
  try {
    const res = await fetch(`${url}/tips.json`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`[verify-live] FAIL: ${url}/tips.json returned ${res.status}`);
      return 1;
    }
    live = await res.json() as TipsJson;
  } catch (err) {
    console.error(`[verify-live] FAIL: Cannot reach ${url}/tips.json:`, err);
    return 1;
  }

  // Check health endpoint
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const health = await res.json() as Record<string, unknown>;
      console.log(`[verify-live] Health: tips=${health.tips} embeddings=${health.embeddingsLoaded} semantic=${health.semanticSearch}`);
    }
  } catch {
    console.warn('[verify-live] Warning: /api/health unreachable');
  }

  const localDate = new Date(local.lastUpdated);
  const liveDate = new Date(live.lastUpdated);
  const driftMs = Math.abs(localDate.getTime() - liveDate.getTime());
  const driftSec = Math.round(driftMs / 1000);

  if (local.lastUpdated === live.lastUpdated) {
    console.log(`[verify-live] OK: Live matches local (${local.totalTips} tips, updated ${local.lastUpdated})`);
    return 0;
  }

  if (driftMs <= maxDrift * 1000) {
    console.log(`[verify-live] OK: Live within tolerance (drift: ${driftSec}s, max: ${maxDrift}s)`);
    return 0;
  }

  console.error(`[verify-live] STALE: Live site is out of date!`);
  console.error(`  Local: ${local.lastUpdated} (${local.totalTips} tips)`);
  console.error(`  Live:  ${live.lastUpdated} (${live.totalTips} tips)`);
  console.error(`  Drift: ${driftSec}s (max allowed: ${maxDrift}s)`);
  console.error(`  Fix:   docker compose restart web-disney`);
  return 1;
}

process.exitCode = await main();
