import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionPreview, getDecisionAreas, type DecisionPreviewTip } from '../shared/decisionPreview.js';

const tips: DecisionPreviewTip[] = [
  {
    id: 'll',
    text: 'Buy Lightning Lane for Magic Kingdom if Peter Pan and Seven Dwarfs are must-dos with young kids.',
    category: 'parks',
    park: 'magic-kingdom',
    tags: ['lightning-lane', 'kids', 'wait-times'],
    priority: 'high',
    source: {
      videoId: 'abc123',
      channelName: 'AllEars.net',
      videoTitle: 'Magic Kingdom tips',
      publishedAt: '2026-05-01T00:00:00.000Z',
    },
  },
];

test('getDecisionAreas maps natural language decisions to pain buckets', () => {
  const areas = getDecisionAreas(
    'Two adults and kids 4 and 8 at Pop Century. Should we buy Lightning Lane or save the money?',
    tips,
  );

  assert.deepEqual(areas.map(area => area.id), ['wait-less', 'avoid-bad-spend', 'protect-energy']);
});

test('buildDecisionPreview preserves the question and builds a plan handoff URL', () => {
  const preview = buildDecisionPreview('  Should we buy Lightning Lane?  ', tips);

  assert.equal(preview.question, 'Should we buy Lightning Lane?');
  assert.equal(preview.results.length, 1);
  assert.equal(preview.planUrl, '/plan.html?decision=Should%20we%20buy%20Lightning%20Lane%3F#planning-request');
});
