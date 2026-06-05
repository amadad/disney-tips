import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';

const homepage = readFileSync('index.html', 'utf-8');
const planPage = readFileSync('plan.html', 'utf-8');

test('homepage is an ask-first decision desk', () => {
  assert.match(homepage, /What Disney decision are you trying to make/i);
  assert.match(homepage, /id="decision-ask-form"/);
  assert.match(homepage, /id="decision-preview"/);
  assert.match(homepage, /Get sourced preview/);
  assert.match(homepage, /class="castle-emoji"/);
  assert.match(homepage, /Decision plan/);
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
  assert.match(planPage, /A decision plan that explains each choice/);
  assert.match(planPage, /Decision plan/);
  assert.match(planPage, /Decision you want solved/);
  assert.match(planPage, /Reservations and spend/);
  assert.match(planPage, /Backup moves/);
  assert.match(planPage, /Day 2 · Magic Kingdom/);
  assert.match(planPage, /Park Hopper/);
  assert.match(planPage, /Lightning Lane for MK \+ HS/);
  assert.match(planPage, /Request one \$39 plan/);
  assert.match(planPage, /id="planning-request-form"/);
});
