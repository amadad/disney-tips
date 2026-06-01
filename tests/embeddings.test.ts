import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  EMBEDDING_SIGNATURE,
  buildEmbeddingsMetadata,
  isCurrentEmbeddingsMetadata,
  pruneEmbeddingsForTipIds,
  roundEmbeddingValues,
} from '../shared/embeddings.js';

test('embedding metadata matches the current Gemini embedding config', () => {
  const meta = buildEmbeddingsMetadata();

  assert.equal(meta.model, EMBEDDING_MODEL);
  assert.equal(meta.dimensions, EMBEDDING_DIMENSIONS);
  assert.equal(meta.signature, EMBEDDING_SIGNATURE);
  assert.equal(isCurrentEmbeddingsMetadata(meta), true);
  assert.equal(isCurrentEmbeddingsMetadata(undefined), false);
  assert.equal(
    isCurrentEmbeddingsMetadata({ ...meta, signature: 'openai:text-embedding-3-small:256' }),
    false,
  );
});

test('roundEmbeddingValues truncates values to six decimal places', () => {
  assert.deepEqual(roundEmbeddingValues([0.123456789, -0.3333339]), [0.123457, -0.333334]);
});

test('pruneEmbeddingsForTipIds removes stale vectors', () => {
  const entries = [
    { tipId: 'keep-1', vector: [1, 2] },
    { tipId: 'stale', vector: [3, 4] },
    { tipId: 'keep-2', vector: [5, 6] },
  ];

  assert.deepEqual(
    pruneEmbeddingsForTipIds(entries, new Set(['keep-1', 'keep-2'])),
    [entries[0], entries[2]]
  );
});
