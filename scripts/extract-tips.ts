import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { Video, VideosData, ExtractedTip, TipsData, TipCategory, Park, ChannelName } from './types.js';

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

VIDEO TITLE: ${video.title}
CHANNEL: ${video.channelName}

TRANSCRIPT:
${transcript}

Extract all Disney-specific actionable tips from this video.`;

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
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

async function main() {
  console.log('Starting tip extraction with Gemini...\n');

  // Load videos
  if (!existsSync('data/videos.json')) {
    console.error('No videos.json found. Run fetch-videos first.');
    process.exit(1);
  }

  const videosData: VideosData = JSON.parse(readFileSync('data/videos.json', 'utf-8'));
  console.log(`Found ${videosData.totalVideos} videos\n`);

  // Load existing tips
  let existingTips: ExtractedTip[] = [];
  if (existsSync('data/tips.json')) {
    const existing: TipsData = JSON.parse(readFileSync('data/tips.json', 'utf-8'));
    existingTips = existing.tips;
    console.log(`Found ${existingTips.length} existing tips\n`);
  }

  // Load processed videos ledger (tracks ALL processed videos, even 0-tip ones)
  let processedVideos: ProcessedVideo[] = [];
  if (existsSync('data/processed-videos.json')) {
    processedVideos = JSON.parse(readFileSync('data/processed-videos.json', 'utf-8'));
  }
  const processedVideoIds = new Set(processedVideos.map(v => v.videoId));
  console.log(`${processedVideoIds.size} videos already processed\n`);

  // Process new videos only
  const videosToProcess = videosData.videos.filter(v => !processedVideoIds.has(v.id) && v.transcript);
  console.log(`Processing ${videosToProcess.length} new videos with transcripts...\n`);

  const newTips: ExtractedTip[] = [];
  const newlyProcessed: ProcessedVideo[] = [];

  for (const video of videosToProcess) {
    console.log(`Processing: ${video.title}`);
    const tips = await extractTipsFromVideo(video);
    newTips.push(...tips);

    // Track this video as processed (even if 0 tips)
    newlyProcessed.push({
      videoId: video.id,
      processedAt: new Date().toISOString(),
      tipCount: tips.length
    });

    console.log(`  Extracted ${tips.length} tips\n`);

    // Rate limit API calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save updated processed videos ledger
  const allProcessed = [...processedVideos, ...newlyProcessed];
  writeFileSync('data/processed-videos.json', JSON.stringify(allProcessed, null, 2));

  // Improved deduplication: hash on text + park + priority to preserve distinct contexts
  const allTips = [...existingTips, ...newTips];
  const tipsByKey = new Map<string, ExtractedTip>();

  for (const tip of allTips) {
    const key = `${tip.text.toLowerCase().trim()}|${tip.park}|${tip.priority}`;

    if (!tipsByKey.has(key)) {
      tipsByKey.set(key, tip);
    }
    // If we wanted to track multiple sources for same tip, we could merge here
    // For now, keep the first (oldest) source
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

  writeFileSync('data/tips.json', JSON.stringify(data, null, 2));

  console.log(`Done! ${newTips.length} new tips extracted from ${newlyProcessed.length} videos.`);
  console.log(`Total tips after deduplication: ${dedupedTips.length}`);
}

main().catch(console.error);
