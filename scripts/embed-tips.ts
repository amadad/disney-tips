import { config } from 'dotenv';
config({ path: '.env.local' });
import { readFileSync, writeFileSync, existsSync } from 'fs';
import OpenAI from 'openai';

interface Tip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
}

interface TipsData {
  tips: Tip[];
}

interface EmbeddingEntry {
  tipId: string;
  vector: number[];
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });

  const tipsData: TipsData = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
  console.log(`Loaded ${tipsData.tips.length} tips`);

  const DIMENSIONS = 256;

  // Load existing embeddings — skip if dimension changed
  let existing: EmbeddingEntry[] = [];
  if (existsSync('data/public/embeddings.json')) {
    const raw: EmbeddingEntry[] = JSON.parse(readFileSync('data/public/embeddings.json', 'utf-8'));
    const dimMatch = raw.length > 0 && raw[0].vector.length === DIMENSIONS;
    if (dimMatch) {
      existing = raw;
    } else {
      console.log(`Dimension changed (was ${raw[0]?.vector.length}, now ${DIMENSIONS}). Re-embedding all tips.`);
    }
  }
  const existingIds = new Set(existing.map(e => e.tipId));

  // Filter to tips needing embeddings
  const needsEmbedding = tipsData.tips.filter(t => !existingIds.has(t.id));
  console.log(`${needsEmbedding.length} tips need embeddings (${existing.length} already done)`);

  if (needsEmbedding.length === 0) {
    console.log('All tips already embedded.');
    return;
  }

  const BATCH_SIZE = 100;
  const newEmbeddings: EmbeddingEntry[] = [];

  for (let i = 0; i < needsEmbedding.length; i += BATCH_SIZE) {
    const batch = needsEmbedding.slice(i, i + BATCH_SIZE);
    const texts = batch.map(t => `${t.text} [${t.category}] [${t.park}] [${t.tags.join(', ')}]`);

    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsEmbedding.length / BATCH_SIZE)}...`);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: DIMENSIONS,
    });

    for (let j = 0; j < batch.length; j++) {
      newEmbeddings.push({
        tipId: batch[j].id,
        vector: response.data[j].embedding.map(v => Math.round(v * 1e6) / 1e6),
      });
    }
  }

  // Truncate existing embeddings to 6 decimal places too
  const allEmbeddings = [...existing.map(e => ({
    tipId: e.tipId,
    vector: e.vector.map(v => Math.round(v * 1e6) / 1e6),
  })), ...newEmbeddings];
  writeFileSync('data/public/embeddings.json', JSON.stringify(allEmbeddings));
  console.log(`Saved ${allEmbeddings.length} embeddings to data/public/embeddings.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
