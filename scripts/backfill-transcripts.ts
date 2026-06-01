import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync, readFileSync } from 'fs';
import type { VideosData } from './types.js';
import { fetchTranscriptViaYtdlp, runTranscriptPreflight, type Logger } from './lib/transcript.js';
import { resolveLastUpdated } from './lib/state.js';

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

const log: Logger = {
  debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};

async function main() {
  const preflight = await runTranscriptPreflight(log);
  if (!preflight.ok) {
    throw new Error('Transcript runtime preflight failed (set TRANSCRIPT_STRICT_PREFLIGHT=false to allow degraded mode)');
  }

  const data: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
  const previousLastUpdated = data.lastUpdated ?? null;

  const missing = data.videos.filter(v => !v.transcript);
  const retriable = missing.filter(v => (v.transcriptRetries ?? 0) < MAX_RETRIES);
  const exhausted = missing.length - retriable.length;

  console.log(`Total videos: ${data.videos.length}`);
  console.log(`Missing transcripts: ${missing.length} (${retriable.length} retriable, ${exhausted} exhausted)`);

  if (retriable.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  let updated = 0;

  for (let i = 0; i < retriable.length; i += BATCH_SIZE) {
    const batch = retriable.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nBatch ${batchNum}: Processing ${batch.length} videos...`);

    let batchUpdated = 0;
    for (const video of batch) {
      const text = await fetchTranscriptViaYtdlp(video.id, preflight.config, log);
      if (text) {
        video.transcript = text;
        video.transcriptRetries = undefined; // clear on success
        updated++;
        batchUpdated++;
        console.log(`  ✓ ${video.id} (${text.length} chars)`);
      } else {
        video.transcriptRetries = (video.transcriptRetries ?? 0) + 1;
        console.log(`  ✗ ${video.id} (attempt ${video.transcriptRetries}/${MAX_RETRIES})`);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Save after each batch so progress isn't lost
    data.lastChecked = new Date().toISOString();
    if (batchUpdated > 0) {
      data.lastUpdated = resolveLastUpdated(previousLastUpdated, updated, data.lastChecked);
    }
    writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));
    console.log(`  Saved (${updated} total updated so far)`);
  }

  console.log(`\nDone. Updated ${updated}/${retriable.length} videos with transcripts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
