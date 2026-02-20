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

  // Load existing embeddings
  let existing: EmbeddingEntry[] = [];
  if (existsSync('data/public/embeddings.json')) {
    existing = JSON.parse(readFileSync('data/public/embeddings.json', 'utf-8'));
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
    });

    for (let j = 0; j < batch.length; j++) {
      newEmbeddings.push({
        tipId: batch[j].id,
        vector: response.data[j].embedding,
      });
    }
  }

  const allEmbeddings = [...existing, ...newEmbeddings];
  writeFileSync('data/public/embeddings.json', JSON.stringify(allEmbeddings));
  console.log(`Saved ${allEmbeddings.length} embeddings to data/public/embeddings.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
