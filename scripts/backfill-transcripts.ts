import { config } from 'dotenv';
config({ path: '.env.local' });
import { ApifyClient } from 'apify-client';
import { writeFileSync, readFileSync } from 'fs';
import type { VideosData } from './types.js';

const BATCH_SIZE = 50;

async function main() {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    console.error('APIFY_API_TOKEN not set');
    process.exit(1);
  }

  const data: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
  const missingTranscripts = data.videos.filter(v => !v.transcript);

  console.log('Total videos:', data.videos.length);
  console.log('Missing transcripts:', missingTranscripts.length);

  if (missingTranscripts.length === 0) {
    console.log('All videos have transcripts!');
    return;
  }

  const client = new ApifyClient({ token: apiToken });
  const videoIds = missingTranscripts.map(v => v.id);

  const transcripts = new Map<string, string>();

  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log('\nBatch ' + batchNum + ': Fetching ' + batch.length + ' transcripts...');

    const run = await client.actor('dB9f4B02ocpTICIEY').call({
      startUrls: batch.map(id => 'https://www.youtube.com/watch?v=' + id),
      timestamps: false
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Debug: show first item structure
    if (items.length > 0) {
      console.log('Response keys:', Object.keys(items[0]));
    }

    for (const item of items) {
      // Try multiple ways to get video ID
      let videoId = item.videoId as string;
      if (!videoId) {
        const url = (item.url || item.videoUrl || item.input) as string;
        const urlMatch = url?.match(/[?&]v=([^&]+)/);
        videoId = urlMatch?.[1] || '';
      }

      const transcriptText = item.text || item.transcript;
      if (videoId && transcriptText) {
        const text = typeof transcriptText === 'string'
          ? transcriptText
          : JSON.stringify(transcriptText);

        if (text.length > 50) {
          transcripts.set(videoId, text.replace(/\s+/g, ' ').trim());
          console.log('  got ' + videoId);
        }
      }
    }
  }

  console.log('\nGot ' + transcripts.size + '/' + missingTranscripts.length + ' transcripts');

  let updated = 0;
  for (const video of data.videos) {
    const transcript = transcripts.get(video.id);
    if (transcript && !video.transcript) {
      video.transcript = transcript;
      updated++;
    }
  }

  data.lastUpdated = new Date().toISOString();
  writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));

  console.log('Updated ' + updated + ' videos with transcripts');
}

main().catch(console.error);
