import { config } from 'dotenv';
config({ path: '.env.local' });
import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { CATEGORY_LABELS, PARK_LABELS } from './types.js';
import type { Video, VideosData, ExtractedTip, TipsData, TipCategory, Park, ChannelName } from './types.js';

// Simple logger with levels
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) || 'info'];

const log = {
  debug: (...args: unknown[]) => LOG_LEVEL <= 0 && console.log('[DEBUG]', ...args),
  info: (...args: unknown[]) => LOG_LEVEL <= 1 && console.log('[INFO]', ...args),
  warn: (...args: unknown[]) => LOG_LEVEL <= 2 && console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => LOG_LEVEL <= 3 && console.error('[ERROR]', ...args),
};

// Quality filter patterns - tips containing these are rejected
const GENERIC_PHRASES = [
  'arrive early', 'plan ahead', 'be prepared', 'pack light',
  'stay hydrated', 'wear comfortable', 'download the app',
  'make a reservation', 'book in advance', 'check the weather',
  'bring sunscreen', 'bring a poncho', 'stay cool', 'take breaks',
  'be patient', 'have fun', 'enjoy yourself', 'take your time'
];

const MERCHANDISE_PATTERNS = [
  /\bis available\b/i,
  /\bnow available\b/i,
  /\bnew (shirt|ears|necklace|bag|backpack|loungefly|spirit jersey|merchandise)\b/i,
  /\b(shirt|ears|jersey) is\b/i,
  /themed (ears|merchandise|apparel)\b/i
];

// Valid category and park enums
const VALID_CATEGORIES = ['parks', 'dining', 'hotels', 'budget', 'planning', 'transportation'] as const;
const VALID_PARKS = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom', 'disney-springs', 'water-parks', 'disneyland', 'california-adventure', 'all-parks'] as const;

// Loose schema for initial parsing (accepts any category string for normalization)
const RawTipSchema = z.object({
  text: z.string().min(10),
  category: z.string(), // Accept any, normalize later
  park: z.string(),     // Accept any, validate later
  tags: z.array(z.string()).min(1),
  priority: z.enum(['high', 'medium', 'low']),
  season: z.enum(['year-round', 'christmas', 'halloween', 'flower-garden', 'food-wine', 'festival-arts', 'summer'])
});

const RawGeminiResponseSchema = z.object({
  tips: z.array(RawTipSchema)
});

// Category normalization for invalid categories
const CATEGORY_MAP: Record<string, TipCategory> = {
  'genie': 'parks',
  'genie+': 'parks',
  'lightning-lane': 'parks',
  'attractions': 'parks',
  'rides': 'parks',
  'food': 'dining',
  'restaurants': 'dining',
  'money': 'budget',
  'savings': 'budget',
  'travel': 'transportation',
};

function normalizeCategory(category: string): TipCategory {
  const lower = category.toLowerCase();
  const mapped = CATEGORY_MAP[lower];
  if (mapped) return mapped;

  // Check if it's already valid
  if (VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return category as TipCategory;
  }

  // Default to 'parks' for unknown categories
  log.debug(`Unknown category "${category}", defaulting to "parks"`);
  return 'parks';
}

function normalizePark(park: string): Park {
  // Check if it's already valid
  if (VALID_PARKS.includes(park as typeof VALID_PARKS[number])) {
    return park as Park;
  }

  // Default to 'all-parks' for unknown parks
  log.debug(`Unknown park "${park}", defaulting to "all-parks"`);
  return 'all-parks';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRfc822Date(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    log.warn(`Invalid date provided for RSS pubDate: "${isoDate}"`);
    return new Date(0).toUTCString();
  }

  return parsed.toUTCString();
}

interface RssChannel {
  title: string;
  link: string;
  description: string;
  lastBuildDate: string;
  language?: string;
  ttl?: number;
  image?: {
    url: string;
    title: string;
    link: string;
  };
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  categories?: string[];
  guidIsPermaLink?: boolean;
}

function generateRssFeed(channel: RssChannel, items: RssItem[]): string {
  const channelParts = [
    `    <title>${escapeXml(channel.title)}</title>`,
    `    <link>${escapeXml(channel.link)}</link>`,
    `    <description>${escapeXml(channel.description)}</description>`,
    `    <lastBuildDate>${escapeXml(channel.lastBuildDate)}</lastBuildDate>`
  ];

  if (channel.language) {
    channelParts.push(`    <language>${escapeXml(channel.language)}</language>`);
  }

  if (typeof channel.ttl === 'number') {
    channelParts.push(`    <ttl>${channel.ttl}</ttl>`);
  }

  if (channel.image) {
    const imageXml = [
      '    <image>',
      `      <url>${escapeXml(channel.image.url)}</url>`,
      `      <title>${escapeXml(channel.image.title)}</title>`,
      `      <link>${escapeXml(channel.image.link)}</link>`,
      '    </image>'
    ].join('\n');
    channelParts.push(imageXml);
  }

  const itemXml = items.map((item) => {
    const categories = item.categories ?? [];
    const categoryXml = categories.map(category =>
      `      <category>${escapeXml(category)}</category>`
    ).join('\n');
    const guidIsPermaLink = item.guidIsPermaLink ? 'true' : 'false';
    const lines = [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.link)}</link>`,
      `      <description>${escapeXml(item.description)}</description>`,
      `      <pubDate>${escapeXml(item.pubDate)}</pubDate>`,
      `      <guid isPermaLink="${guidIsPermaLink}">${escapeXml(item.guid)}</guid>`
    ];
    if (categoryXml) {
      lines.push(categoryXml);
    }
    lines.push('    </item>');
    return lines.join('\n');
  });

  if (itemXml.length > 0) {
    channelParts.push(itemXml.join('\n'));
  }

  const channelXml = `  <channel>\n${channelParts.join('\n')}\n  </channel>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n${channelXml}\n</rss>\n`;
}

// Quality filter - returns true if tip should be KEPT
function isHighQualityTip(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Reject generic phrases
  for (const phrase of GENERIC_PHRASES) {
    if (lowerText.includes(phrase)) {
      log.debug(`Rejected (generic phrase "${phrase}"): ${text.slice(0, 50)}...`);
      return false;
    }
  }

  // Reject merchandise announcements
  for (const pattern of MERCHANDISE_PATTERNS) {
    if (pattern.test(text)) {
      log.debug(`Rejected (merchandise): ${text.slice(0, 50)}...`);
      return false;
    }
  }

  // Reject tips that are too short (likely not actionable)
  if (text.length < 50) {
    log.debug(`Rejected (too short): ${text}`);
    return false;
  }

  // Reject tips that are just descriptions without actionable advice
  const actionablePatterns = [
    /\b(try|get|use|ask|book|order|arrive|head|go|visit|check|grab|skip|avoid|consider|take|make sure|don't|do not)\b/i
  ];

  const hasActionableVerb = actionablePatterns.some(p => p.test(text));
  if (!hasActionableVerb) {
    // Allow if it has specific Disney terms even without action verbs
    const disneyTerms = /\b(lightning lane|genie\+|rope drop|fireworks|parade|skyliner|monorail|magic kingdom|epcot|hollywood studios|animal kingdom)\b/i;
    if (!disneyTerms.test(text)) {
      log.debug(`Rejected (not actionable): ${text.slice(0, 50)}...`);
      return false;
    }
  }

  return true;
}

// Processed videos ledger type
interface ProcessedVideo {
  videoId: string;
  processedAt: string;
  tipCount: number;
}

// Validate API key early
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Set it via: export GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configurable model - defaults to gemini-2.5-flash-lite
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

// Define schema for Gemini structured output (native format, not JSON Schema)
const tipsSchema = {
  type: Type.OBJECT,
  properties: {
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: 'The tip itself - 1-2 sentences, clear and actionable'
          },
          category: {
            type: Type.STRING,
            enum: ['parks', 'dining', 'hotels', 'budget', 'planning', 'transportation'],
            description: 'Category of the tip - must be specific, never use general'
          },
          park: {
            type: Type.STRING,
            enum: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom', 'disney-springs', 'water-parks', 'disneyland', 'california-adventure', 'all-parks'],
            description: 'Specific park the tip applies to, or all-parks if broadly applicable'
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2-4 lowercase hyphenated tags like rope-drop, lightning-lane, quick-service, table-service, character-meet'
          },
          priority: {
            type: Type.STRING,
            enum: ['high', 'medium', 'low'],
            description: 'high = saves 30+ min or $50+, medium = notable improvement, low = nice to know'
          },
          season: {
            type: Type.STRING,
            enum: ['year-round', 'christmas', 'halloween', 'flower-garden', 'food-wine', 'festival-arts', 'summer'],
            description: 'When this tip is most relevant'
          }
        },
        required: ['text', 'category', 'park', 'tags', 'priority', 'season']
      }
    }
  },
  required: ['tips']
};

async function extractTipsFromVideo(video: Video): Promise<ExtractedTip[]> {
  if (!video.transcript) {
    console.log(`  Skipping ${video.title} - no transcript`);
    return [];
  }

  // Truncate transcript if too long
  const maxTranscriptLength = 50000;
  let transcript = video.transcript;
  if (transcript.length > maxTranscriptLength) {
    console.log(`  Warning: Truncating transcript from ${transcript.length} to ${maxTranscriptLength} chars`);
    transcript = transcript.slice(0, maxTranscriptLength) + '...';
  }

  const prompt = `You are a STRICT curator extracting ONLY highly valuable Disney tips from video transcripts.

REJECT these types of content (DO NOT extract):
- Merchandise announcements ("X is available", "new ears/shirt/bag")
- Generic travel advice ("arrive early", "plan ahead", "stay hydrated", "be patient")
- Event descriptions without actionable advice
- Opinions without tips ("X is fun!", "we loved Y")
- Non-Disney content (Universal, SeaWorld, off-property hotels)
- Past events with specific dates

ONLY EXTRACT tips that are:
- ACTIONABLE: Contains a verb telling the reader what to DO (try, get, use, book, skip, avoid, head to)
- SPECIFIC: Mentions a specific ride, restaurant, resort, show, or Disney strategy BY NAME
- VALUABLE: Saves time, saves money, or significantly improves the visit experience

Quality bar: Would a first-time Disney visitor find this tip genuinely helpful and specific?

CATEGORIZATION RULES:
- "parks" = ride strategies, show times, park navigation, attractions
- "dining" = restaurants, snacks, mobile ordering, reservations
- "hotels" = resort-specific tips, room requests, resort perks
- "budget" = saving money, free experiences, discounts
- "planning" = booking windows, trip timing, app usage
- "transportation" = buses, monorail, Skyliner, parking, Minnie Vans

TAG FORMAT: Use lowercase with hyphens (rope-drop, lightning-lane, quick-service, table-service, character-meet, fireworks, parade, mobile-order, dining-reservation, resort-hopping)

PRIORITY GUIDE:
- "high" = Can save 30+ minutes of wait time, $50+ savings, or significantly improve experience
- "medium" = Notable improvement to visit, good to know
- "low" = Nice detail, minor enhancement

FEW-SHOT EXAMPLES:

Input: "Make sure to bring a poncho because it rains a lot in Florida."
Output: (SKIP - too generic)

Input: "At Magic Kingdom, head straight to Seven Dwarfs Mine Train at rope drop if you don't have Lightning Lane, otherwise the wait will be over 90 minutes instantly."
Output: {
  "text": "Head to Seven Dwarfs Mine Train immediately at rope drop if you don't have Lightning Lane to avoid 90+ minute waits.",
  "category": "parks",
  "park": "magic-kingdom",
  "tags": ["rope-drop", "wait-times"],
  "priority": "high",
  "season": "year-round"
}

Input: "The beignets at Port Orleans French Quarter are shaped like Mickey and are a must-try snack."
Output: {
  "text": "Try the Mickey-shaped beignets at Port Orleans French Quarter for a classic resort snack.",
  "category": "dining",
  "park": "all-parks",
  "tags": ["snacks", "resort-dining"],
  "priority": "low",
  "season": "year-round"
}

VIDEO TITLE: ${video.title}
CHANNEL: ${video.channelName}

TRANSCRIPT:
${transcript}

Extract all Disney-specific actionable tips from this video.`;

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: tipsSchema
        }
      });

      const text = response.text;
      if (!text) return [];

      const rawParsed = JSON.parse(text);

      // Validate with loose schema (allows any category/park for normalization)
      const validated = RawGeminiResponseSchema.safeParse(rawParsed);

      if (!validated.success) {
        console.error(`  Validation failed (attempt ${attempt + 1}):`, validated.error.issues.slice(0, 3));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      // Apply quality filter and normalize categories/parks
      const qualityTips = validated.data.tips
        .filter(tip => isHighQualityTip(tip.text))
        .map((tip) => ({
          id: randomUUID(),
          text: tip.text,
          category: normalizeCategory(tip.category),
          park: normalizePark(tip.park),
          tags: tip.tags,
          priority: tip.priority,
          season: tip.season,
          source: {
            videoId: video.id,
            channelName: video.channelName as ChannelName,
            videoTitle: video.title,
            publishedAt: video.publishedAt
          },
          extractedAt: new Date().toISOString()
        }));

      const filtered = validated.data.tips.length - qualityTips.length;
      if (filtered > 0) {
        log.debug(`Filtered ${filtered} low-quality tips from ${video.title}`);
      }

      return qualityTips;
    } catch (error) {
      console.error(`  Error (attempt ${attempt + 1}):`, error instanceof Error ? error.message : error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      return [];
    }
  }

  return [];
}

// Simple concurrency limiter
async function pMap<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));

  async function worker() {
    while (queue.length > 0) {
      const { item, index } = queue.shift()!;
      results[index] = await mapper(item);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );

  return results;
}

async function main() {
  log.info(`Starting tip extraction with Gemini (model: ${GEMINI_MODEL})...`);

  // Load videos
  if (!existsSync('data/pipeline/videos.json')) {
    log.error('No videos.json found. Run fetch-videos first.');
    process.exit(1);
  }

  const videosData: VideosData = JSON.parse(readFileSync('data/pipeline/videos.json', 'utf-8'));
  log.info(`Found ${videosData.totalVideos} videos`);

  // Load existing tips
  let existingTips: ExtractedTip[] = [];
  let previousLastUpdated: string | undefined;
  if (existsSync('data/public/tips.json')) {
    const existing: TipsData = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
    existingTips = existing.tips;
    previousLastUpdated = existing.lastUpdated;
    log.info(`Found ${existingTips.length} existing tips`);
  }

  // Load processed videos ledger (tracks ALL processed videos, even 0-tip ones)
  let processedVideos: ProcessedVideo[] = [];
  if (existsSync('data/pipeline/processed-videos.json')) {
    processedVideos = JSON.parse(readFileSync('data/pipeline/processed-videos.json', 'utf-8'));
  }
  const processedVideoIds = new Set(processedVideos.map(v => v.videoId));
  log.info(`${processedVideoIds.size} videos already processed`);

  // Process new videos only
  const videosToProcess = videosData.videos.filter(v => !processedVideoIds.has(v.id) && v.transcript);
  log.info(`Processing ${videosToProcess.length} new videos with transcripts...`);

  const newlyProcessed: ProcessedVideo[] = [];

  // Use concurrency
  const CONCURRENCY_LIMIT = 3;

  const results = await pMap(videosToProcess, async (video) => {
    console.log(`Processing: ${video.title}`);
    const tips = await extractTipsFromVideo(video);

    // Return both tips and processing status
    return {
      tips,
      processedRecord: {
        videoId: video.id,
        processedAt: new Date().toISOString(),
        tipCount: tips.length
      }
    };
  }, CONCURRENCY_LIMIT);

  // Flatten results
  const newTips = results.flatMap(r => r.tips);
  newlyProcessed.push(...results.map(r => r.processedRecord));

  log.info(`Extracted ${newTips.length} new tips from ${videosToProcess.length} videos`);

  // Save updated processed videos ledger
  const allProcessed = [...processedVideos, ...newlyProcessed];
  writeFileSync('data/pipeline/processed-videos.json', JSON.stringify(allProcessed, null, 2));

  // Improved deduplication: hash on text + category + park + priority to preserve distinct contexts
  const allTips = [...existingTips, ...newTips];
  const tipsByKey = new Map<string, ExtractedTip>();

  for (const tip of allTips) {
    // Normalize text for deduplication (lowercase, remove punctuation)
    const normalizedText = tip.text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const key = `${normalizedText}|${tip.category}|${tip.park}|${tip.priority}`;

    if (!tipsByKey.has(key)) {
      tipsByKey.set(key, tip);
    }
  }

  const dedupedTips = Array.from(tipsByKey.values());

  // Sort by publish date (newest first)
  dedupedTips.sort((a, b) =>
    new Date(b.source.publishedAt).getTime() - new Date(a.source.publishedAt).getTime()
  );

  const nowIso = new Date().toISOString();
  const lastUpdated = newTips.length > 0 ? nowIso : (previousLastUpdated ?? nowIso);
  const data: TipsData = {
    lastUpdated,
    totalTips: dedupedTips.length,
    tips: dedupedTips
  };

  writeFileSync('data/public/tips.json', JSON.stringify(data, null, 2));

  const siteUrl = process.env.SITE_URL || 'https://disney.bound.tips';
  const rssChannel: RssChannel = {
    title: 'Disney Tips - bound.tips',
    link: siteUrl,
    description: 'Daily Disney tips extracted from top YouTube channels',
    language: 'en-us',
    ttl: 1440,
    lastBuildDate: formatRfc822Date(data.lastUpdated),
    image: {
      url: `${siteUrl}/og-image.png`,
      title: 'Disney Tips - bound.tips',
      link: siteUrl
    }
  };
  // Limit RSS feed to 50 most recent tips (already sorted by date).
  const rssTips = dedupedTips.slice(0, 50);
  const rssItems: RssItem[] = rssTips.map((tip) => {
    const title = tip.text.length > 100 ? `${tip.text.slice(0, 97)}...` : tip.text;
    const priorityLabel = `${tip.priority.slice(0, 1).toUpperCase()}${tip.priority.slice(1)}`;
    return {
      title,
      link: `https://www.youtube.com/watch?v=${tip.source.videoId}`,
      description: `${tip.text} (Source: ${tip.source.channelName})`,
      pubDate: formatRfc822Date(tip.source.publishedAt),
      guid: tip.id,
      guidIsPermaLink: false,
      categories: [
        CATEGORY_LABELS[tip.category],
        PARK_LABELS[tip.park],
        priorityLabel
      ]
    };
  });
  const rssFeed = generateRssFeed(rssChannel, rssItems);
  writeFileSync('data/public/feed.xml', rssFeed);

  const health = {
    status: 'ok',
    lastUpdated: data.lastUpdated,
    totalTips: data.totalTips
  };
  writeFileSync('data/public/health.json', JSON.stringify(health, null, 2));

  const lastmod = data.lastUpdated.split('T')[0];
  const pages = [
    '',
    '/about.html',
    '/parks.html',
    '/dining.html',
    '/hotels.html',
    '/budget.html',
    '/planning.html',
    '/transportation.html'
  ];
  const sitemapEntries = pages.map(path => `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;
  writeFileSync('data/public/sitemap.xml', sitemap);

  console.log(`Done! Saved ${dedupedTips.length} tips to data/tips.json (Deduplicated from ${allTips.length})`);
}

main().catch(console.error);
