import { Innertube } from 'youtubei.js';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import type { Video, VideosData } from './types.js';

const log = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  debug: (...args: unknown[]) => console.log('[DEBUG]', ...args),
};

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

function parseTimedTextXml(xml: string): string {
  const segments: string[] = [];
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
    if (text) segments.push(text);
  }
  return segments.join(' ');
}

async function getTranscriptWithYtDlp(videoId: string): Promise<string | undefined> {
  try {
    const tmpFile = `/tmp/yt_sub_${videoId}`;
    execSync(
      `yt-dlp --write-auto-sub --write-sub --skip-download --sub-lang en -o "${tmpFile}" "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null`,
      { timeout: 30000 }
    );
    const extensions = ['.en.vtt', '.en.srt', '.en-orig.vtt'];
    for (const ext of extensions) {
      const filePath = tmpFile + ext;
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        unlinkSync(filePath);
        const text = content
          .split('\n')
          .filter(line => !line.match(/^(\d|WEBVTT|Kind:|Language:)/))
          .filter(line => !line.match(/^\d{2}:\d{2}/))
          .filter(line => !line.match(/^$/))
          .join(' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (text.length > 50) return cleanTranscript(text);
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

async function getTranscript(videoId: string): Promise<string | undefined> {
  // Try yt-dlp first
  const ytdlpResult = await getTranscriptWithYtDlp(videoId);
  if (ytdlpResult) return ytdlpResult;

  // Fallback to youtubei.js
  try {
    const yt = await Innertube.create({ generate_session_locally: true });
    const info = await yt.getBasicInfo(videoId);
    const captionTracks = info.captions?.caption_tracks;
    if (!captionTracks?.length) return undefined;

    const englishTrack = captionTracks.find(
      (track) => track.language_code === 'en' || track.language_code?.startsWith('en')
    );
    const track = englishTrack || captionTracks[0];
    const baseUrl = track.base_url;
    if (!baseUrl) return undefined;

    let xml = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(baseUrl);
      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
        continue;
      }
      if (!response.ok) return undefined;
      xml = await response.text();
      break;
    }
    if (!xml) return undefined;

    const text = parseTimedTextXml(xml);
    if (text.length <= 50) return undefined;
    return cleanTranscript(text);
  } catch {
    return undefined;
  }
}

async function main() {
  log.info('Backfilling transcripts for videos missing them...');

  const data: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
  const videosWithoutTranscript = data.videos.filter(v => !v.transcript);

  log.info(`Found ${videosWithoutTranscript.length} videos without transcripts`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videosWithoutTranscript.length; i++) {
    const video = videosWithoutTranscript[i];
    process.stdout.write(`[${i + 1}/${videosWithoutTranscript.length}] ${video.title.substring(0, 45)}... `);

    const transcript = await getTranscript(video.id);

    if (transcript) {
      video.transcript = transcript;
      successCount++;
      console.log(`✓ (${transcript.length} chars)`);
    } else {
      failCount++;
      console.log('✗ no transcript');
    }

    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Write updated data
  data.lastUpdated = new Date().toISOString();
  writeFileSync('data/pipeline/videos.json', JSON.stringify(data, null, 2));

  log.info(`Done! ${successCount} transcripts fetched, ${failCount} unavailable.`);
}

main().catch(console.error);
