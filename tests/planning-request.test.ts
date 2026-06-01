import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAN_PRIORITIES,
  buildPlanningRequestResponse,
  parsePlanningRequest,
  formatPlanningRequestEmail,
} from '../shared/planningRequest.js';

const validRequest = {
  name: 'Maya',
  email: 'MAYA@example.com ',
  destination: 'walt-disney-world',
  dates: 'October 12-18, 2026',
  hotel: 'Pop Century',
  party: '2 adults, kids 4 and 8',
  budget: 'balanced',
  priorities: ['wait-less', 'save-money'],
  mustDos: 'Princess meal, Slinky Dog, fireworks',
  concerns: 'Heat and too much walking',
  consent: true,
};

test('parsePlanningRequest accepts and normalizes a valid request', () => {
  const result = parsePlanningRequest(validRequest);

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.email, 'maya@example.com');
  assert.equal(result.value.name, 'Maya');
  assert.deepEqual(result.value.priorities, ['wait-less', 'save-money']);
  assert.equal(result.value.concerns, 'Heat and too much walking');
});

test('parsePlanningRequest rejects missing consent', () => {
  const result = parsePlanningRequest({ ...validRequest, consent: false });

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.status, 400);
  assert.match(result.error, /consent/i);
});

test('parsePlanningRequest rejects unknown priority values', () => {
  const result = parsePlanningRequest({
    ...validRequest,
    priorities: [PLAN_PRIORITIES[0].id, 'vip-shortcut'],
  });

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.equal(result.status, 400);
  assert.match(result.error, /priority/i);
});

test('formatPlanningRequestEmail summarizes the paid manual offer lead', () => {
  const result = parsePlanningRequest(validRequest);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const text = formatPlanningRequestEmail({
    id: 'plan_123',
    createdAt: '2026-05-04T12:00:00.000Z',
    ip: '127.0.0.1',
    userAgent: 'node:test',
    request: result.value,
  });

  assert.match(text, /Plan request plan_123/);
  assert.match(text, /maya@example\.com/);
  assert.match(text, /wait-less, save-money/);
  assert.match(text, /Launch offer: \$39 custom family plan/);
});

test('buildPlanningRequestResponse includes payment link when configured', () => {
  assert.deepEqual(buildPlanningRequestResponse('plan_123', ' https://pay.example/abc '), {
    ok: true,
    id: 'plan_123',
    price: 39,
    paymentUrl: 'https://pay.example/abc',
    message: 'Request received. Use the payment link to reserve the $39 family plan.',
  });
});

test('buildPlanningRequestResponse falls back to manual follow-up without payment link', () => {
  assert.deepEqual(buildPlanningRequestResponse('plan_123', ''), {
    ok: true,
    id: 'plan_123',
    price: 39,
    message: 'Request received. I will review it and follow up about the $39 family plan.',
  });
});
