import { Innertube } from 'youtubei.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { DISNEY_CHANNELS, type Video, type VideosData, type ChannelName } from './types.js';

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
  // Remove common sponsor segments
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

  // Normalize whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

// Parse timedtext XML to extract transcript text
function parseTimedTextXml(xml: string): string {
  const segments: string[] = [];

  // Match both <text> and <p> tag formats YouTube uses
  const textRegex = /<(?:text|p)[^>]*>([^<]*)<\/(?:text|p)>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    if (text) {
      segments.push(text);
    }
  }

  return segments.join(' ');
}

async function getTranscript(_yt: Innertube, videoId: string): Promise<string | undefined> {
  try {
    // Create a fresh session for each video to avoid rate limiting detection
    const yt = await Innertube.create({ generate_session_locally: true });

    // Use getBasicInfo to get caption tracks (avoids the blocked getTranscript endpoint)
    const info = await yt.getBasicInfo(videoId);

    // Get caption tracks from the captions object (not streaming_data)
    const captionTracks = info.captions?.caption_tracks;

    if (!captionTracks || captionTracks.length === 0) {
      log.debug(`No caption tracks for ${videoId}`);
      return undefined;
    }

    // Prefer English captions, fall back to first available
    const englishTrack = captionTracks.find(
      (track) => track.language_code === 'en' || track.language_code?.startsWith('en')
    );
    const track = englishTrack || captionTracks[0];

    // Get the base URL for the caption track
    const baseUrl = track.base_url;
    if (!baseUrl) {
      log.debug(`No base URL for caption track ${videoId}`);
      return undefined;
    }

    // Fetch the timedtext XML directly with retry for rate limits
    let xml = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(baseUrl);

      if (response.status === 429) {
        // Rate limited - wait and retry
        const delay = (attempt + 1) * 2000;
        log.debug(`Rate limited for ${videoId}, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        log.debug(`Failed to fetch captions for ${videoId}: ${response.status}`);
        return undefined;
      }

      xml = await response.text();
      break;
    }

    if (!xml) return undefined;

    const text = parseTimedTextXml(xml);

    if (text.length <= 50) return undefined;

    // Clean up transcript
    return cleanTranscript(text);
  } catch (error) {
    // Silently fail - many videos won't have transcripts
    log.debug(`No transcript for ${videoId}:`, error instanceof Error ? error.message : error);
    return undefined;
  }
}

async function main() {
  log.info('Starting video fetch via RSS + youtubei.js...');

  // Initialize YouTube client with session generation to bypass bot detection
  const yt = await Innertube.create({
    generate_session_locally: true
  });

  // Load existing videos to avoid re-fetching transcripts
  let existingVideos: Video[] = [];
  if (existsSync('data/pipeline/videos.json')) {
    const existing: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
    existingVideos = existing.videos;
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

  log.info(`Processing ${videosToProcess.length} new videos for transcripts...`);

  // Fetch transcripts sequentially (to be nice to YouTube)
  const newVideos: Video[] = [];
  for (const { channelName, rssVideo } of videosToProcess) {
    process.stdout.write(`  ${rssVideo.title.substring(0, 50)}... `);

    const transcript = await getTranscript(yt, rssVideo.id);

    newVideos.push({
      id: rssVideo.id,
      channelName,
      title: rssVideo.title,
      description: '',
      publishedAt: rssVideo.publishedAt,
      thumbnail: rssVideo.thumbnail,
      transcript
    });

    if (transcript) {
      console.log(`✓ (${transcript.length} chars)`);
    } else {
      console.log('✗ no transcript');
    }

    // Longer delay to avoid rate limiting (1.5s between requests)
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Merge and sort by date
  const allVideos = [...existingVideos, ...newVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const data: VideosData = {
    lastUpdated: new Date().toISOString(),
    totalVideos: allVideos.length,
    videos: allVideos
  };

  writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));

  const withTranscripts = newVideos.filter(v => v.transcript).length;
  log.info(`Done! ${newVideos.length} new videos added (${withTranscripts} with transcripts).`);
  log.info(`Total videos: ${allVideos.length}`);
}

main().catch(console.error);
