import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync } from 'fs';
import type { ExtractedTip, TipsData, TipCategory } from './types.js';

// Validate API key early
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Quality filter patterns (same as extract-tips.ts)
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

function isHighQualityTip(text: string): boolean {
  const lowerText = text.toLowerCase();

  for (const phrase of GENERIC_PHRASES) {
    if (lowerText.includes(phrase)) return false;
  }

  for (const pattern of MERCHANDISE_PATTERNS) {
    if (pattern.test(text)) return false;
  }

  if (text.length < 50) return false;

  const actionablePatterns = [
    /\b(try|get|use|ask|book|order|arrive|head|go|visit|check|grab|skip|avoid|consider|take|make sure|don't|do not)\b/i
  ];

  const hasActionableVerb = actionablePatterns.some(p => p.test(text));
  if (!hasActionableVerb) {
    const disneyTerms = /\b(lightning lane|genie\+|rope drop|fireworks|parade|skyliner|monorail|magic kingdom|epcot|hollywood studios|animal kingdom)\b/i;
    if (!disneyTerms.test(text)) return false;
  }

  return true;
}

// Fix invalid categories
const VALID_CATEGORIES = ['parks', 'dining', 'hotels', 'budget', 'planning', 'transportation'];
function normalizeCategory(category: string): TipCategory {
  if (VALID_CATEGORIES.includes(category)) return category as TipCategory;
  if (category === 'genie' || category === 'genie+') return 'parks';
  return 'parks';
}

async function deduplicateBatch(tips: ExtractedTip[]): Promise<number[]> {
  const prompt = `You are deduplicating Disney tips. Analyze these tips and identify which ones are semantically DUPLICATE or REDUNDANT.

Tips (index: text):
${tips.map((t, i) => `${i}: ${t.text}`).join('\n')}

For tips that say essentially the same thing (even with different wording), keep ONLY the BEST version:
- Prefer more specific tips over vague ones
- Prefer tips with more detail
- Prefer tips from more recent videos

Return a JSON object with:
- "keep": array of indices to KEEP (the best version of each unique tip)
- "removed": array of indices that are duplicates of kept tips

Example response: {"keep": [0, 2, 5, 7], "removed": [1, 3, 4, 6]}

IMPORTANT: Every index from 0 to ${tips.length - 1} must appear in either "keep" or "removed".`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return tips.map((_, i) => i); // Keep all if no response

    const result = JSON.parse(text);
    return result.keep || tips.map((_, i) => i);
  } catch (error) {
    console.error('Dedup batch error:', error);
    return tips.map((_, i) => i); // Keep all on error
  }
}

async function selectTopTips(tips: ExtractedTip[], count: number = 100): Promise<string[]> {
  // Process in chunks if too many tips
  const CHUNK_SIZE = 200;

  if (tips.length <= CHUNK_SIZE) {
    return await selectTopTipsChunk(tips, count);
  }

  // For large datasets, first select top from each category, then final selection
  const byCategory = new Map<string, ExtractedTip[]>();
  for (const tip of tips) {
    const cat = tip.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(tip);
  }

  const perCategory = Math.ceil(count / byCategory.size);
  const candidates: ExtractedTip[] = [];

  for (const [category, catTips] of byCategory) {
    console.log(`  Selecting top ${perCategory} from ${category} (${catTips.length} tips)...`);
    const topIds = await selectTopTipsChunk(catTips, perCategory);
    candidates.push(...catTips.filter(t => topIds.includes(t.id)));
  }

  // Final selection from candidates
  console.log(`  Final selection from ${candidates.length} candidates...`);
  return await selectTopTipsChunk(candidates, count);
}

async function selectTopTipsChunk(tips: ExtractedTip[], count: number): Promise<string[]> {
  const prompt = `You are curating the BEST Disney tips. From these ${tips.length} tips, select the ${count} MOST VALUABLE.

Prioritize tips that:
- Save significant time (30+ minutes) or money ($50+)
- Are highly specific (mention exact rides, restaurants, strategies)
- Are actionable (tell the reader exactly what to do)
- Are unique insights (not common knowledge)

Tips (id: text):
${tips.map(t => `${t.id}: ${t.text}`).join('\n')}

Return JSON: {"topIds": ["id1", "id2", ...]}

Select exactly ${Math.min(count, tips.length)} tips.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return tips.slice(0, count).map(t => t.id);

    const result = JSON.parse(text);
    return result.topIds || tips.slice(0, count).map(t => t.id);
  } catch (error) {
    console.error('Top tips selection error:', error);
    return tips.slice(0, count).map(t => t.id);
  }
}

async function main() {
  console.log('Loading tips...');
  const data: TipsData = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
  console.log(`Loaded ${data.tips.length} tips`);

  // Step 1: Apply quality filter and normalize categories
  console.log('\nStep 1: Applying quality filter...');
  const qualityTips = data.tips
    .filter(tip => isHighQualityTip(tip.text))
    .map(tip => ({
      ...tip,
      category: normalizeCategory(tip.category)
    }));
  console.log(`After quality filter: ${qualityTips.length} tips (removed ${data.tips.length - qualityTips.length})`);

  // Step 2: Semantic deduplication in batches
  console.log('\nStep 2: Semantic deduplication...');
  const BATCH_SIZE = 50;
  let dedupedTips: ExtractedTip[] = [];

  for (let i = 0; i < qualityTips.length; i += BATCH_SIZE) {
    const batch = qualityTips.slice(i, i + BATCH_SIZE);
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(qualityTips.length / BATCH_SIZE)}...`);

    const keepIndices = await deduplicateBatch(batch);
    const kept = keepIndices.map(idx => batch[idx]).filter(Boolean);
    dedupedTips.push(...kept);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`After deduplication: ${dedupedTips.length} tips`);

  // Step 3: Select top 100 tips
  console.log('\nStep 3: Selecting top 100 tips...');
  const topTipIds = await selectTopTips(dedupedTips, 100);
  console.log(`Selected ${topTipIds.length} top tips`);

  // Sort by date (newest first)
  dedupedTips.sort((a, b) =>
    new Date(b.source.publishedAt).getTime() - new Date(a.source.publishedAt).getTime()
  );

  // Save
  const output: TipsData & { topTips: string[] } = {
    lastUpdated: new Date().toISOString(),
    totalTips: dedupedTips.length,
    tips: dedupedTips,
    topTips: topTipIds
  };

  writeFileSync('data/public/tips.json', JSON.stringify(output, null, 2));
  console.log(`\nDone! Saved ${dedupedTips.length} tips with ${topTipIds.length} top tips`);
}

main().catch(console.error);
