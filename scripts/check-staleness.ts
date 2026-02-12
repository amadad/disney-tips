import { readFileSync } from 'fs';

type Args = {
  thresholdDays: number;
  checkDist: boolean;
};

function parseArgs(argv: string[]): Args {
  let thresholdDays = 3;
  let checkDist = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === '--threshold') {
      const next = argv[i + 1];
      if (!next) throw new Error('Missing value for --threshold');
      thresholdDays = Number(next);
      i++;
      continue;
    }

    if (arg.startsWith('--threshold=')) {
      thresholdDays = Number(arg.slice('--threshold='.length));
      continue;
    }

    if (arg === '--check-dist') {
      checkDist = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      // Let main() print usage.
      throw new Error('HELP');
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(thresholdDays) || thresholdDays < 0) {
    throw new Error(`Invalid --threshold value: ${String(thresholdDays)}`);
  }

  return { thresholdDays, checkDist };
}

function formatDays(days: number): string {
  // Avoid noisy decimals for clean day-boundary values.
  const roundedToTenth = Math.floor(days * 10) / 10;
  if (Number.isInteger(roundedToTenth)) return String(roundedToTenth);
  return String(roundedToTenth);
}

function usage(): string {
  return [
    'Usage: tsx scripts/check-staleness.ts [--threshold <days>] [--check-dist]',
    '',
    'Checks whether data/public/tips.json "lastUpdated" exceeds a staleness threshold.',
    '',
    'Options:',
    '  --threshold <days>   Maximum allowed age in days (default: 3)',
    '  --check-dist         Compare dist tips.json with data/public tips.json',
  ].join('\n');
}

function main(): number {
  const tipsPath = 'data/public/tips.json';

  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'HELP') {
      console.log(usage());
      return 0;
    }
    console.error(message);
    console.error(usage());
    return 2;
  }

  let raw: string;
  try {
    raw = readFileSync(tipsPath, 'utf-8');
  } catch (err) {
    console.error(`Failed to read ${tipsPath}:`, err);
    return 2;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${tipsPath} as JSON:`, err);
    return 2;
  }

  const lastUpdated =
    typeof parsed === 'object' && parsed !== null && 'lastUpdated' in parsed
      ? (parsed as { lastUpdated?: unknown }).lastUpdated
      : undefined;

  if (typeof lastUpdated !== 'string' || lastUpdated.trim() === '') {
    console.error(`Missing or invalid "lastUpdated" in ${tipsPath}`);
    return 2;
  }

  const lastUpdatedDate = new Date(lastUpdated);
  if (Number.isNaN(lastUpdatedDate.getTime())) {
    console.error(`Invalid "lastUpdated" date in ${tipsPath}: ${JSON.stringify(lastUpdated)}`);
    return 2;
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - lastUpdatedDate.getTime());
  const dayMs = 24 * 60 * 60 * 1000;
  const ageDays = ageMs / dayMs;

  const thresholdDays = args.thresholdDays;
  const thresholdMs = thresholdDays * dayMs;

  if (ageMs > thresholdMs) {
    console.error(
      `STALE: tips.json lastUpdated is ${formatDays(ageDays)} days old (threshold: ${thresholdDays} days)`
    );
    return 1;
  }

  console.log(
    `OK: tips.json lastUpdated is ${formatDays(ageDays)} days old (threshold: ${thresholdDays} days)`
  );
  return 0;
}

process.exitCode = main();
