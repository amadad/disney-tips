import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPilotReadiness,
  getPlanningPilotReadiness,
  summarizePlanningPilot,
  type PlanningPilotEvent,
} from '../shared/planningPilot.js';
import type { StoredPlanningRequest } from '../shared/planningRequest.js';

function request(id: string, email = `${id}@example.com`): StoredPlanningRequest {
  return {
    id,
    createdAt: '2026-05-04T12:00:00.000Z',
    ip: '127.0.0.1',
    userAgent: 'node:test',
    request: {
      name: id,
      email,
      destination: 'walt-disney-world',
      dates: 'October 12-18, 2026',
      hotel: 'Pop Century',
      party: '2 adults; kids 4 and 8',
      budget: 'balanced',
      priorities: ['wait-less'],
      mustDos: '',
      concerns: '',
    },
  };
}

function event(requestId: string, type: PlanningPilotEvent['type']): PlanningPilotEvent {
  return {
    id: `${requestId}-${type}`,
    requestId,
    type,
    createdAt: '2026-05-04T13:00:00.000Z',
    note: '',
  };
}

test('summarizePlanningPilot counts paid and decision-solved requests as validated', () => {
  const summary = summarizePlanningPilot(
    [request('one'), request('two'), request('three')],
    [
      event('one', 'paid'),
      event('one', 'plan-sent'),
      event('two', 'decision-solved'),
      event('three', 'declined'),
    ],
  );

  assert.equal(summary.totalRequests, 3);
  assert.equal(summary.paidRequests, 1);
  assert.equal(summary.fulfilledRequests, 1);
  assert.equal(summary.validatedRequests, 2);
  assert.equal(summary.declinedRequests, 1);
  assert.equal(summary.validationMet, false);
});

test('summarizePlanningPilot marks validation met at five validated families', () => {
  const requests = ['one', 'two', 'three', 'four', 'five'].map((id) => request(id));
  const events = requests.map((item) => event(item.id, 'paid'));

  const summary = summarizePlanningPilot(requests, events);

  assert.equal(summary.validatedRequests, 5);
  assert.equal(summary.validationMet, true);
  assert.equal(summary.remainingToValidation, 0);
});

test('summarizePlanningPilot surfaces open follow-up requests', () => {
  const summary = summarizePlanningPilot(
    [request('new-lead'), request('paid-lead'), request('declined-lead')],
    [event('paid-lead', 'paid'), event('declined-lead', 'declined')],
  );

  assert.deepEqual(summary.openRequestIds, ['new-lead']);
  assert.equal(summary.remainingToValidation, 4);
});

test('getPlanningPilotReadiness blocks outreach when notification recipient is missing', () => {
  const summary = summarizePlanningPilot([], []);
  const readiness = getPlanningPilotReadiness(summary, {
    RESEND_API_KEY: 'resend_key',
    PLAN_REQUEST_RECIPIENT: '',
    PLAN_PAYMENT_URL: 'https://pay.example/plan',
  });

  assert.equal(readiness.readyForOutreach, false);
  assert.equal(readiness.emailNotifications, 'missing');
  assert.match(formatPilotReadiness(readiness), /PLAN_REQUEST_RECIPIENT is missing/);
});

test('getPlanningPilotReadiness allows manual payment follow-up when notifications are configured', () => {
  const summary = summarizePlanningPilot([], []);
  const readiness = getPlanningPilotReadiness(summary, {
    RESEND_API_KEY: 'resend_key',
    PLAN_REQUEST_RECIPIENT: 'planner@example.com',
    PLAN_PAYMENT_URL: '',
  });

  assert.equal(readiness.readyForOutreach, true);
  assert.equal(readiness.emailNotifications, 'configured');
  assert.equal(readiness.paymentCollection, 'manual-follow-up');
  assert.match(formatPilotReadiness(readiness), /PLAN_PAYMENT_URL is missing/);
});
