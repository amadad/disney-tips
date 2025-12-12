import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
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

// Zod schema for validating Gemini response
const TipSchema = z.object({
  text: z.string().min(10),
  category: z.enum(['parks', 'dining', 'hotels', 'budget', 'planning', 'transportation']),
  park: z.enum(['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom', 'disney-springs', 'water-parks', 'disneyland', 'california-adventure', 'all-parks']),
  tags: z.array(z.string()).min(1),
  priority: z.enum(['high', 'medium', 'low']),
  season: z.enum(['year-round', 'christmas', 'halloween', 'flower-garden', 'food-wine', 'festival-arts', 'summer'])
});

const GeminiResponseSchema = z.object({
  tips: z.array(TipSchema)
});

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

  const prompt = `You are analyzing a Disney parks YouTube video transcript to extract actionable tips for visitors.

IMPORTANT RULES:
1. ONLY extract tips about Disney parks (Walt Disney World, Disneyland, Disney Cruise Line)
2. DO NOT include tips about Universal Studios, SeaWorld, or other non-Disney destinations
3. DO NOT include generic travel advice (packing lists, what to wear, etc.) unless Disney-specific
4. Skip tips about specific dates/events that have already passed

Each tip should be:
- Concrete and specific (not vague advice like "plan ahead")
- Actionable (something a visitor can actually do)
- Disney-specific (mentions a specific ride, restaurant, resort, or Disney strategy)

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

      // Validate with Zod
      const validated = GeminiResponseSchema.safeParse(rawParsed);

      if (!validated.success) {
        console.error(`  Validation failed (attempt ${attempt + 1}):`, validated.error.issues.slice(0, 3));
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return [];
      }

      return validated.data.tips.map((tip) => ({
        id: randomUUID(),
        text: tip.text,
        category: tip.category as TipCategory,
        park: tip.park as Park,
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
  if (existsSync('data/public/tips.json')) {
    const existing: TipsData = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
    existingTips = existing.tips;
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

  const data: TipsData = {
    lastUpdated: new Date().toISOString(),
    totalTips: dedupedTips.length,
    tips: dedupedTips
  };

  writeFileSync('data/public/tips.json', JSON.stringify(data, null, 2));

  console.log(`Done! Saved ${dedupedTips.length} tips to data/tips.json (Deduplicated from ${allTips.length})`);
}

main().catch(console.error);
