import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTipsByCategoryPark,
  normalizeSearchFilter,
  normalizeSearchLimit,
  textSearchTipIds,
} from '../shared/tipSearch.js';

const tips = [
  {
    id: 'mk',
    text: 'Use Lightning Lane for Jungle Cruise at Magic Kingdom on party days.',
    category: 'parks',
    park: 'magic-kingdom',
    tags: ['lightning-lane', 'magic-kingdom'],
  },
  {
    id: 'epcot-food',
    text: 'Mobile order festival snacks at EPCOT before the dinner rush.',
    category: 'dining',
    park: 'epcot',
    tags: ['mobile-order', 'festival'],
  },
  {
    id: 'all',
    text: 'Pack a resort rest break into any long park day with kids.',
    category: 'planning',
    park: 'all-parks',
    tags: ['rest-break', 'kids'],
  },
];

test('filterTipsByCategoryPark applies category and park filters before ranking', () => {
  assert.deepEqual(
    filterTipsByCategoryPark(tips, { category: 'dining', park: 'epcot' }).map(t => t.id),
    ['epcot-food']
  );

  assert.deepEqual(
    filterTipsByCategoryPark(tips, { park: 'magic-kingdom' }).map(t => t.id),
    ['mk', 'all']
  );
});

test('textSearchTipIds searches only matching filtered candidates', () => {
  assert.deepEqual(
    textSearchTipIds(tips, 'mobile order', { category: 'dining', park: 'epcot' }, 10),
    ['epcot-food']
  );

  assert.deepEqual(
    textSearchTipIds(tips, 'mobile order', { category: 'parks', park: 'magic-kingdom' }, 10),
    []
  );
});

test('normalizeSearchLimit clamps unsafe limits', () => {
  assert.equal(normalizeSearchLimit(undefined), 100);
  assert.equal(normalizeSearchLimit('12'), 12);
  assert.equal(normalizeSearchLimit('9999'), 100);
  assert.equal(normalizeSearchLimit('-1'), 100);
});

test('normalizeSearchFilter drops empty and all filters', () => {
  assert.equal(normalizeSearchFilter(undefined), undefined);
  assert.equal(normalizeSearchFilter(''), undefined);
  assert.equal(normalizeSearchFilter(' all '), undefined);
  assert.equal(normalizeSearchFilter('epcot'), 'epcot');
});
