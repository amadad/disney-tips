import { GoogleGenAI, Type } from '@google/genai';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Video, VideosData, ExtractedTip, TipsData, TipCategory, Park, ChannelName } from './types.js';

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
            enum: ['parks', 'dining', 'hotels', 'genie', 'budget', 'planning', 'transportation', 'general'],
            description: 'Category of the tip'
          },
          park: {
            type: Type.STRING,
            enum: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom', 'disney-springs', 'water-parks', 'general'],
            description: 'Specific park if applicable'
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2-4 relevant tags like "rope drop", "lightning lane", "quick service"'
          }
        },
        required: ['text', 'category', 'tags']
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
  const transcript = video.transcript.length > maxTranscriptLength
    ? video.transcript.slice(0, maxTranscriptLength) + '...'
    : video.transcript;

  const prompt = `You are analyzing a Disney World YouTube video transcript to extract actionable tips for visitors.

Extract specific, actionable tips from this transcript. Each tip should be:
- Concrete and specific (not vague advice)
- Actionable (something a visitor can actually do)
- Current (if it mentions dates/times that have passed, skip it)

VIDEO TITLE: ${video.title}
CHANNEL: ${video.channelName}

TRANSCRIPT:
${transcript}

Extract all useful tips from this video.`;

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

    const parsed = JSON.parse(text) as { tips: Array<{ text: string; category: string; park?: string; tags: string[] }> };

    return parsed.tips.map((tip) => ({
      id: randomUUID(),
      text: tip.text,
      category: tip.category as TipCategory,
      park: tip.park as Park | undefined,
      tags: tip.tags || [],
      source: {
        videoId: video.id,
        channelName: video.channelName as ChannelName,
        videoTitle: video.title,
        publishedAt: video.publishedAt
      },
      extractedAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`  Error extracting from ${video.title}:`, error);
    return [];
  }
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

  // Load existing tips to track which videos have been processed
  let existingTips: ExtractedTip[] = [];
  const processedVideoIds = new Set<string>();

  if (existsSync('data/tips.json')) {
    const existing: TipsData = JSON.parse(readFileSync('data/tips.json', 'utf-8'));
    existingTips = existing.tips;
    existingTips.forEach(tip => processedVideoIds.add(tip.source.videoId));
    console.log(`Found ${existingTips.length} existing tips from ${processedVideoIds.size} videos\n`);
  }

  // Process new videos only
  const videosToProcess = videosData.videos.filter(v => !processedVideoIds.has(v.id) && v.transcript);
  console.log(`Processing ${videosToProcess.length} new videos with transcripts...\n`);

  const newTips: ExtractedTip[] = [];

  for (const video of videosToProcess) {
    console.log(`Processing: ${video.title}`);
    const tips = await extractTipsFromVideo(video);
    newTips.push(...tips);
    console.log(`  Extracted ${tips.length} tips\n`);

    // Rate limit API calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Merge and deduplicate tips (simple text match)
  const allTips = [...existingTips, ...newTips];
  const seenTexts = new Set<string>();
  const dedupedTips = allTips.filter(tip => {
    const normalized = tip.text.toLowerCase().trim();
    if (seenTexts.has(normalized)) return false;
    seenTexts.add(normalized);
    return true;
  });

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

  console.log(`Done! ${newTips.length} new tips extracted.`);
  console.log(`Total tips after deduplication: ${dedupedTips.length}`);
}

main().catch(console.error);
