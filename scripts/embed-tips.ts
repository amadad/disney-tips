import { config } from 'dotenv';
config({ path: '.env.local' });
import { existsSync, readFileSync } from 'fs';
import {
  buildEmbeddingsMetadata,
  createEmbeddingClient,
  EMBEDDING_DIMENSIONS,
  embedTexts,
  isCurrentEmbeddingsMetadata,
  pruneEmbeddingsForTipIds,
  type EmbeddingEntry,
} from '../shared/embeddings.js';
import { ensurePublicArtifactModeSync, writePublicArtifactSync } from './lib/public-artifacts.js';

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

const EMBEDDINGS_PATH = 'data/public/embeddings.json';
const EMBEDDINGS_META_PATH = 'data/public/embeddings.meta.json';
const BATCH_SIZE = 25;
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 5000;
const BETWEEN_BATCH_DELAY_MS = 1000;

function loadExistingEmbeddings(currentTipIds: Set<string>): { entries: EmbeddingEntry[]; pruned: number } {
  if (!existsSync(EMBEDDINGS_PATH)) return { entries: [], pruned: 0 };

  let metadataMatches = false;
  if (existsSync(EMBEDDINGS_META_PATH)) {
    try {
      metadataMatches = isCurrentEmbeddingsMetadata(JSON.parse(readFileSync(EMBEDDINGS_META_PATH, 'utf-8')));
    } catch {
      metadataMatches = false;
    }
  }

  const raw: EmbeddingEntry[] = JSON.parse(readFileSync(EMBEDDINGS_PATH, 'utf-8'));
  const dimMatch = raw.every(entry => entry.vector.length === EMBEDDING_DIMENSIONS);

  if (metadataMatches && dimMatch) {
    const pruned = pruneEmbeddingsForTipIds(raw, currentTipIds);
    return { entries: pruned, pruned: raw.length - pruned.length };
  }

  console.log('Embedding config changed or metadata missing. Re-embedding all tips.');
  return { entries: [], pruned: raw.length };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetriableEmbeddingError(err: unknown): boolean {
  const status = typeof err === 'object' && err !== null && 'status' in err ? Number((err as { status?: unknown }).status) : undefined;
  const message = err instanceof Error ? err.message : String(err);
  return status === 429 || status === 503 || message.includes('RESOURCE_EXHAUSTED');
}

async function embedBatchWithRetry(
  texts: string[],
  startIndex: number,
  totalCount: number,
  embeddingClient: NonNullable<ReturnType<typeof createEmbeddingClient>>,
): Promise<number[][]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await embedTexts(embeddingClient, texts, 'RETRIEVAL_DOCUMENT');
    } catch (err) {
      if (!isRetriableEmbeddingError(err) || attempt === MAX_RETRIES) {
        throw err;
      }
      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `Embedding batch at tip ${startIndex + 1}/${totalCount} hit a transient API limit. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw new Error('Unreachable');
}

async function main() {
  const tipsData: TipsData = JSON.parse(readFileSync('data/public/tips.json', 'utf-8'));
  console.log(`Loaded ${tipsData.tips.length} tips`);

  const currentTipIds = new Set(tipsData.tips.map(tip => tip.id));
  const { entries: existing, pruned } = loadExistingEmbeddings(currentTipIds);
  const existingIds = new Set(existing.map(entry => entry.tipId));

  const needsEmbedding = tipsData.tips.filter(tip => !existingIds.has(tip.id));
  console.log(`${needsEmbedding.length} tips need embeddings (${existing.length} already done, ${pruned} stale pruned)`);

  if (needsEmbedding.length === 0) {
    console.log('All tips already embedded.');
    if (pruned > 0 || !existsSync(EMBEDDINGS_META_PATH)) {
      writePublicArtifactSync(EMBEDDINGS_PATH, JSON.stringify(existing));
      writePublicArtifactSync(EMBEDDINGS_META_PATH, JSON.stringify(buildEmbeddingsMetadata(), null, 2));
    } else {
      ensurePublicArtifactModeSync(EMBEDDINGS_PATH);
      ensurePublicArtifactModeSync(EMBEDDINGS_META_PATH);
    }
    return;
  }

  const embeddingClient = createEmbeddingClient(process.env.GEMINI_API_KEY);
  if (!embeddingClient) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  const allEmbeddings: EmbeddingEntry[] = [...existing];

  for (let i = 0; i < needsEmbedding.length; i += BATCH_SIZE) {
    const batch = needsEmbedding.slice(i, i + BATCH_SIZE);
    const texts = batch.map(tip => `${tip.text} [${tip.category}] [${tip.park}] [${tip.tags.join(', ')}]`);

    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsEmbedding.length / BATCH_SIZE)}...`);

    const vectors = await embedBatchWithRetry(texts, i, needsEmbedding.length, embeddingClient);

    for (let j = 0; j < batch.length; j++) {
      allEmbeddings.push({
        tipId: batch[j].id,
        vector: vectors[j],
      });
    }

    writePublicArtifactSync(EMBEDDINGS_PATH, JSON.stringify(allEmbeddings));
    writePublicArtifactSync(EMBEDDINGS_META_PATH, JSON.stringify(buildEmbeddingsMetadata(), null, 2));
    console.log(`Saved checkpoint with ${allEmbeddings.length} embeddings`);

    if (i + BATCH_SIZE < needsEmbedding.length) {
      await sleep(BETWEEN_BATCH_DELAY_MS);
    }
  }

  console.log(`Saved ${allEmbeddings.length} embeddings to ${EMBEDDINGS_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
