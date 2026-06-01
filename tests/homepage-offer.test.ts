import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

const homepage = readFileSync('index.html', 'utf-8');
const planPage = readFileSync('plan.html', 'utf-8');

test('homepage is a minimal bubble-wand landing page', () => {
  assert.match(homepage, /price of one bubble wand/i);
  assert.match(homepage, /class="castle-emoji"/);
  assert.match(homepage, /Get the \$39 plan/);
  assert.match(homepage, /href="plan\.html"/);
  assert.match(homepage, /href="tips\.html"/);
  assert.doesNotMatch(homepage, /bubble-wand-card/);
  assert.doesNotMatch(homepage, /id="sample-plan"/);
  assert.doesNotMatch(homepage, /id="planning-request-form"/);
  assert.doesNotMatch(homepage, /id="tips-container"/);
});

test('plan page shows a concrete sample planning deliverable and request form', () => {
  assert.match(planPage, /id="sample-plan"/);
  assert.match(planPage, /Example email plan/);
  assert.match(planPage, /A full trip plan that explains each choice/);
  assert.match(planPage, /Full trip plan/);
  assert.match(planPage, /Reservations and spend/);
  assert.match(planPage, /Backup moves/);
  assert.match(planPage, /Day 2 · Magic Kingdom/);
  assert.match(planPage, /Park Hopper/);
  assert.match(planPage, /Lightning Lane for MK \+ HS/);
  assert.match(planPage, /Request one \$39 plan/);
  assert.match(planPage, /id="planning-request-form"/);
});
