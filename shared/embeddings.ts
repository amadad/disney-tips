import { GoogleGenAI } from '@google/genai';

export const EMBEDDING_PROVIDER = 'google-genai';
export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = 256;
export const EMBEDDING_SIGNATURE = `${EMBEDDING_PROVIDER}:${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}`;

export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

export interface EmbeddingsMetadata {
  provider: string;
  model: string;
  dimensions: number;
  signature: string;
  generatedAt: string;
}

export interface EmbeddingEntry {
  tipId: string;
  vector: number[];
}

export function createEmbeddingClient(apiKey: string | undefined): GoogleGenAI | null {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function roundEmbeddingValues(values: number[]): number[] {
  return values.map(value => Math.round(value * 1e6) / 1e6);
}

export function pruneEmbeddingsForTipIds<T extends EmbeddingEntry>(entries: T[], tipIds: Set<string>): T[] {
  return entries.filter(entry => tipIds.has(entry.tipId));
}

export function buildEmbeddingsMetadata(): EmbeddingsMetadata {
  return {
    provider: EMBEDDING_PROVIDER,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    signature: EMBEDDING_SIGNATURE,
    generatedAt: new Date().toISOString(),
  };
}

export function isCurrentEmbeddingsMetadata(value: unknown): value is EmbeddingsMetadata {
  if (!value || typeof value !== 'object') return false;

  const meta = value as Partial<EmbeddingsMetadata>;
  return (
    meta.provider === EMBEDDING_PROVIDER &&
    meta.model === EMBEDDING_MODEL &&
    meta.dimensions === EMBEDDING_DIMENSIONS &&
    meta.signature === EMBEDDING_SIGNATURE
  );
}

export async function embedTexts(
  client: GoogleGenAI,
  texts: string[],
  taskType: EmbeddingTaskType,
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType,
    },
  });

  const embeddings = response.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error(`Expected ${texts.length} embeddings, received ${embeddings.length}`);
  }

  return embeddings.map((embedding, index) => {
    const values = embedding.values;
    if (!values || values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding ${index + 1}/${texts.length} missing values or wrong dimension (${values?.length ?? 0})`,
      );
    }
    return roundEmbeddingValues(values);
  });
}
