import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTipQualityDecision,
  isDisneyRelevantVideoTitle,
  isHighQualityTipText,
  normalizeTipTags,
} from '../shared/tipQuality.js';

test('tip quality rejects competitor park tips even when the model returns them', () => {
  const decision = getTipQualityDecision(
    'Head to Hagrid\'s Magical Creatures Motorbike Adventure first thing at Islands of Adventure to avoid long waits.'
  );

  assert.equal(decision.keep, false);
  assert.equal(decision.reason, 'competitor-content');
});

test('tip quality rejects merch drops and promo-code copy', () => {
  assert.equal(
    isHighQualityTipText('Check out the new Belle Loungefly bag and matching Tiana ears at World of Disney.'),
    false
  );
  assert.equal(
    isHighQualityTipText('Use discount code WDW20 for 20% off select products this month.'),
    false
  );
});

test('tip quality keeps specific Disney planning advice', () => {
  assert.equal(
    isHighQualityTipText(
      'Use the Skyliner from Pop Century for Hollywood Studios rope drop, but leave extra time if storms are forecast.'
    ),
    true
  );
});

test('video title relevance rejects competitor park videos before extraction', () => {
  assert.equal(isDisneyRelevantVideoTitle('How to Do Universal Orlando in ONE DAY'), false);
  assert.equal(isDisneyRelevantVideoTitle('36 Basic Disney World Tricks That Make Your Trip Better'), true);
  assert.equal(isDisneyRelevantVideoTitle('MONORAIL RESORT REVIEW: Bay Lake Tower Review'), true);
});

test('normalizeTipTags makes model tags URL-safe and stable', () => {
  assert.deepEqual(
    normalizeTipTags([' lightning- McQueen ', "galaxy's-edge", 'Chef Mickey\u2019s', '']),
    ['lightning-mcqueen', 'galaxys-edge', 'chef-mickeys']
  );
});
