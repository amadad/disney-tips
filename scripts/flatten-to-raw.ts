/**
 * flatten-to-raw.ts
 *
 * One-time backfill: explode data/pipeline/videos.json into raw/ markdown files,
 * one per transcripted video. This creates the LLM-wiki "raw sources" layer —
 * immutable, one-file-per-source, LLM-friendly for ingest sessions.
 *
 * Ongoing: fetch-videos.ts will mirror each new video into raw/ at fetch time
 * so the raw corpus grows with the pipeline.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { VideosData, Video } from './types.js';

const VIDEOS_JSON = 'data/pipeline/videos.json';
const RAW_DIR = 'raw';

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics
    .toLowerCase()
    .replace(/['"]/g, '')              // drop quotes entirely
    .replace(/[^a-z0-9]+/g, '-')        // non-alphanum → hyphen
    .replace(/^-+|-+$/g, '')            // trim hyphens
    .slice(0, 60)                       // cap length
    .replace(/-+$/g, '');               // re-trim if we chopped mid-hyphen
}

function isoDate(publishedAt: string): string {
  // publishedAt is ISO-ish; take the YYYY-MM-DD part
  return publishedAt.slice(0, 10);
}

function yamlEscape(s: string): string {
  // YAML-safe double-quoted string
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function renderRawFile(video: Video): string {
  const frontmatter = [
    '---',
    `video_id: ${video.id}`,
    `channel: ${video.channelName}`,
    `title: ${yamlEscape(video.title)}`,
    `published: ${isoDate(video.publishedAt)}`,
    `url: https://www.youtube.com/watch?v=${video.id}`,
    '---',
    '',
  ].join('\n');

  return frontmatter + (video.transcript ?? '') + '\n';
}

function pathFor(video: Video): string {
  const channelDir = video.channelName.replace(/[^A-Za-z0-9._-]/g, '_');
  const date = isoDate(video.publishedAt);
  const slug = slugify(video.title) || video.id;
  return join(RAW_DIR, channelDir, `${date}-${slug}.md`);
}

function main() {
  if (!existsSync(VIDEOS_JSON)) {
    console.error(`[ERROR] ${VIDEOS_JSON} not found`);
    process.exit(1);
  }

  const data: VideosData = JSON.parse(readFileSync(VIDEOS_JSON, 'utf-8'));
  const transcripted = data.videos.filter((v) => v.transcript && v.transcript.length > 0);

  console.log(`[INFO] ${data.videos.length} total videos, ${transcripted.length} with transcripts`);

  // Track collisions — if two videos on the same day from the same channel
  // have slugs that collide (e.g. same title), append video_id suffix to the second.
  const seenPaths = new Set<string>();
  let written = 0;
  let skipped = 0;

  for (const video of transcripted) {
    let path = pathFor(video);
    if (seenPaths.has(path)) {
      // collision — append short video_id suffix
      const suffix = video.id.slice(0, 6);
      path = path.replace(/\.md$/, `-${suffix}.md`);
    }
    seenPaths.add(path);

    if (existsSync(path)) {
      skipped++;
      continue;  // raw files are immutable; never overwrite
    }

    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, renderRawFile(video));
    written++;
  }

  console.log(`[INFO] wrote ${written} new raw files, skipped ${skipped} existing`);
  console.log(`[INFO] raw/ is ready for wiki bootstrap`);
}

main();
