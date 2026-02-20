import { writeFileSync, readFileSync } from 'fs';
import type { VideosData } from './types.js';
import { fetchTranscriptViaYtdlp, runTranscriptPreflight, type Logger } from './lib/transcript.js';
import { resolveLastUpdated } from './lib/state.js';

const BATCH_SIZE = 20;

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
  const missingTranscripts = data.videos.filter(v => !v.transcript);

  console.log('Total videos:', data.videos.length);
  console.log('Missing transcripts:', missingTranscripts.length);

  if (missingTranscripts.length === 0) {
    console.log('All videos have transcripts!');
    return;
  }

  let updated = 0;

  for (let i = 0; i < missingTranscripts.length; i += BATCH_SIZE) {
    const batch = missingTranscripts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nBatch ${batchNum}: Processing ${batch.length} videos...`);

    let batchUpdated = 0;
    for (const video of batch) {
      const text = await fetchTranscriptViaYtdlp(video.id, preflight.config, log);
      if (text) {
        video.transcript = text;
        updated++;
        batchUpdated++;
        console.log(`  ✓ ${video.id} (${text.length} chars)`);
      } else {
        console.log(`  ✗ ${video.id} (no subtitles)`);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Save after each batch so progress isn't lost
    if (batchUpdated > 0) {
      data.lastUpdated = resolveLastUpdated(previousLastUpdated, updated, new Date().toISOString());
      data.lastChecked = new Date().toISOString();
      writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));
      console.log(`  Saved (${updated} total updated so far)`);
    }
  }

  console.log(`\nDone. Updated ${updated} videos with transcripts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
