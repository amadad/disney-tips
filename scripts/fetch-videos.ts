import { Innertube } from 'youtubei.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { DISNEY_CHANNELS, type Video, type VideosData, type ChannelName } from './types.js';

// YouTube RSS feed URL for a channel
const RSS_URL = (channelId: string) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

interface RSSVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
}

async function fetchRSS(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
  return response.text();
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

async function getTranscript(yt: Innertube, videoId: string): Promise<string | undefined> {
  try {
    const info = await yt.getInfo(videoId);
    const transcript = await info.getTranscript();
    const segments = transcript?.transcript?.content?.body?.initial_segments || [];

    if (segments.length === 0) return undefined;

    // Extract text from segments
    const text = segments
      .map((seg: { snippet?: { text?: string } }) => seg.snippet?.text || '')
      .filter(Boolean)
      .join(' ');

    return text.length > 50 ? text : undefined;
  } catch (error) {
    // Silently fail - many videos won't have transcripts
    return undefined;
  }
}

async function fetchChannelVideos(
  yt: Innertube,
  channelName: ChannelName,
  channelId: string,
  existingIds: Set<string>
): Promise<Video[]> {
  console.log(`Fetching videos from ${channelName}...`);

  const xml = await fetchRSS(RSS_URL(channelId));
  const rssVideos = parseRSS(xml);

  // Filter to only new videos
  const newRssVideos = rssVideos.filter(v => !existingIds.has(v.id));
  console.log(`  Found ${rssVideos.length} videos in RSS, ${newRssVideos.length} new`);

  if (newRssVideos.length === 0) {
    return [];
  }

  const videos: Video[] = [];

  for (const rssVideo of newRssVideos) {
    process.stdout.write(`  ${rssVideo.title.substring(0, 50)}... `);

    const transcript = await getTranscript(yt, rssVideo.id);

    videos.push({
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

    // Small delay to be nice to YouTube
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return videos;
}

async function main() {
  console.log('Starting video fetch via RSS + youtubei.js...\n');

  // Initialize YouTube client
  const yt = await Innertube.create();

  // Load existing videos to avoid re-fetching transcripts
  let existingVideos: Video[] = [];
  if (existsSync('data/videos.json')) {
    const existing: VideosData = JSON.parse(readFileSync('data/videos.json', 'utf-8'));
    existingVideos = existing.videos;
    console.log(`Found ${existingVideos.length} existing videos\n`);
  }

  const existingIds = new Set(existingVideos.map(v => v.id));
  const newVideos: Video[] = [];

  for (const [channelName, channelId] of Object.entries(DISNEY_CHANNELS)) {
    try {
      const videos = await fetchChannelVideos(yt, channelName as ChannelName, channelId, existingIds);
      newVideos.push(...videos);
    } catch (error) {
      console.error(`  Error fetching ${channelName}:`, error);
    }

    console.log('');
  }

  // Merge and sort by date
  const allVideos = [...existingVideos, ...newVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const data: VideosData = {
    lastUpdated: new Date().toISOString(),
    totalVideos: allVideos.length,
    videos: allVideos
  };

  writeFileSync('data/videos.json', JSON.stringify(data, null, 2));

  const withTranscripts = newVideos.filter(v => v.transcript).length;
  console.log(`Done! ${newVideos.length} new videos added (${withTranscripts} with transcripts).`);
  console.log(`Total videos: ${allVideos.length}`);
}

main().catch(console.error);
