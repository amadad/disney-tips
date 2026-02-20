import { config } from 'dotenv';
config({ path: '.env.local' });
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { DISNEY_CHANNELS, type Video, type VideosData, type ChannelName } from './types.js';
import { fetchTranscriptViaYtdlp, runTranscriptPreflight, type TranscriptRuntimeConfig } from './lib/transcript.js';
import { resolveLastUpdated } from './lib/state.js';

// Simple logger with levels
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) || 'info'];

const log = {
  debug: (...args: unknown[]) => LOG_LEVEL <= 0 && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => LOG_LEVEL <= 1 && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => LOG_LEVEL <= 2 && console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => LOG_LEVEL <= 3 && console.error('[ERROR]', ...args),
};

// YouTube RSS feed URL for a channel
const RSS_URL = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

// Exponential backoff helper
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; context?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, context = 'operation' } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        log.error(`${context} failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      log.warn(`${context} failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

interface RSSVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

async function fetchRSS(url: string): Promise<string> {
  return withRetry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
      return response.text();
    },
    { context: `RSS fetch ${url.slice(-20)}` }
  );
}

function parseRSS(xml: string): RSSVideo[] {
  const videos: RSSVideo[] = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/;
  const titleRegex = /<title>([^<]+)<\/title>/;
  const publishedRegex = /<published>([^<]+)<\/published>/;
  const thumbnailRegex = /<media:thumbnail[^>]+url="([^"]+)"/;

  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const videoId = entry.match(videoIdRegex)?.[1];
    const title = entry.match(titleRegex)?.[1];
    const publishedAt = entry.match(publishedRegex)?.[1];
    const thumbnail = entry.match(thumbnailRegex)?.[1];

    if (videoId && title) {
      videos.push({
        id: videoId,
        title: decodeHTMLEntities(title),
        publishedAt: publishedAt || new Date().toISOString(),
        thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      });
    }
  }

  return videos;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Clean transcript text - remove common sponsor/ad patterns
function cleanTranscript(text: string): string {
  const sponsorPatterns = [
    /thanks? to [\w\s]+ for sponsoring/gi,
    /this video is sponsored by/gi,
    /use code [\w]+ for \d+% off/gi,
    /go to [\w.]+\.com\/[\w]+/gi,
    /link in the description/gi,
  ];

  let cleaned = text;
  for (const pattern of sponsorPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

// Fetch transcripts for multiple videos via yt-dlp (sequential to avoid rate limits)
async function getTranscripts(videoIds: string[], runtime: TranscriptRuntimeConfig): Promise<Map<string, string>> {
  if (videoIds.length === 0) return new Map();

  log.info(`Fetching ${videoIds.length} transcripts via yt-dlp + WARP...`);
  const transcripts = new Map<string, string>();

  for (const videoId of videoIds) {
    const text = await fetchTranscriptViaYtdlp(videoId, runtime, log);
    if (text) {
      transcripts.set(videoId, cleanTranscript(text));
      log.info(`  ✓ ${videoId} (${text.length} chars)`);
    } else {
      log.info(`  ✗ ${videoId} (no subtitles)`);
    }
    // Small delay between requests
    if (videoIds.length > 5) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  log.info(`Got ${transcripts.size}/${videoIds.length} transcripts`);
  return transcripts;
}

async function main() {
  log.info('Starting video fetch via RSS + yt-dlp...');

  // Load existing videos to avoid re-fetching transcripts
  let existingVideos: Video[] = [];
  let previousLastUpdated: string | null = null;
  if (existsSync('data/pipeline/videos.json')) {
    const existing: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
    existingVideos = existing.videos;
    previousLastUpdated = existing.lastUpdated ?? null;
    log.info(`Found ${existingVideos.length} existing videos`);
  }

  const existingIds = new Set(existingVideos.map(v => v.id));

  // Fetch RSS feeds in parallel (fast, lightweight)
  log.info('Fetching RSS feeds in parallel...');
  const channelEntries = Object.entries(DISNEY_CHANNELS);
  const rssResults = await Promise.allSettled(
    channelEntries.map(async ([channelName, channelId]) => {
      const xml = await fetchRSS(RSS_URL(channelId));
      const rssVideos = parseRSS(xml);
      return { channelName: channelName as ChannelName, rssVideos };
    })
  );

  // Collect all new videos to fetch transcripts for
  const videosToProcess: { channelName: ChannelName; rssVideo: RSSVideo }[] = [];

  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      const { channelName, rssVideos } = result.value;
      const newVideos = rssVideos.filter(v => !existingIds.has(v.id));
      log.info(`${channelName}: ${rssVideos.length} in RSS, ${newVideos.length} new`);
      for (const rssVideo of newVideos) {
        videosToProcess.push({ channelName, rssVideo });
      }
    } else {
      log.error(`RSS fetch failed:`, result.reason);
    }
  }

  log.info(`Found ${videosToProcess.length} new videos`);

  const preflight = await runTranscriptPreflight(log);
  if (!preflight.ok) {
    throw new Error('Transcript runtime preflight failed (set TRANSCRIPT_STRICT_PREFLIGHT=false to allow degraded mode)');
  }

  // Fetch transcripts via yt-dlp + WARP proxy
  const videoIds = videosToProcess.map(v => v.rssVideo.id);
  const transcripts = await getTranscripts(videoIds, preflight.config);

  // Build video objects with transcripts
  const newVideos: Video[] = videosToProcess.map(({ channelName, rssVideo }) => {
    const transcript = transcripts.get(rssVideo.id);
    const status = transcript ? `✓ (${transcript.length} chars)` : '✗ no transcript';
    log.info(`  ${rssVideo.title.substring(0, 50)}... ${status}`);

    return {
      id: rssVideo.id,
      channelName,
      title: rssVideo.title,
      description: '',
      publishedAt: rssVideo.publishedAt,
      thumbnail: rssVideo.thumbnail,
      transcript
    };
  });

  // Merge and sort by date
  const allVideos = [...existingVideos, ...newVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const nowIso = new Date().toISOString();
  const lastUpdated = resolveLastUpdated(previousLastUpdated, newVideos.length, nowIso);
  if (newVideos.length > 0 || !previousLastUpdated) {
    log.info(`lastUpdated advanced to ${lastUpdated}`);
  } else {
    log.info(`lastUpdated preserved at ${lastUpdated}`);
  }

  const data: VideosData = {
    lastUpdated,
    lastChecked: nowIso,
    totalVideos: allVideos.length,
    videos: allVideos
  };

  writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));

  const withTranscripts = newVideos.filter(v => v.transcript).length;
  log.info(`Done! ${newVideos.length} new videos added (${withTranscripts} with transcripts).`);
  log.info(`Total videos: ${allVideos.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
