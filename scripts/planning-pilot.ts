import { appendFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import {
  formatPilotReadiness,
  formatPilotSummary,
  getPlanningPilotReadiness,
  isPlanningPilotEventType,
  PLANNING_PILOT_EVENT_TYPES,
  summarizePlanningPilot,
  type PlanningPilotEvent,
} from '../shared/planningPilot.js';
import { PLAN_PRICE, type StoredPlanningRequest } from '../shared/planningRequest.js';

const PRIVATE_DIR = join(import.meta.dirname, '..', 'data', 'private');
const REQUESTS_PATH = join(PRIVATE_DIR, 'planning-requests.jsonl');
const EVENTS_PATH = join(PRIVATE_DIR, 'planning-pilot-events.jsonl');

loadEnv({ path: join(import.meta.dirname, '..', '.env.local'), quiet: true });
loadEnv({ path: join(import.meta.dirname, '..', '.env'), quiet: true });

function usage(): never {
  console.error(`Usage:
  npm run pilot -- summary
  npm run pilot -- readiness
  npm run pilot -- list
  npm run pilot -- template <request-id>
  npm run pilot -- event <request-id> <${PLANNING_PILOT_EVENT_TYPES.join('|')}> [--amount ${PLAN_PRICE}] [--note "..."]
`);
  process.exit(1);
}

async function readJsonl<T>(path: string): Promise<T[]> {
  if (!existsSync(path)) return [];
  const raw = await readFile(path, 'utf-8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as T;
      } catch (error) {
        throw new Error(`Invalid JSON in ${path} line ${index + 1}: ${(error as Error).message}`);
      }
    });
}

async function loadPilotData() {
  const [requests, events] = await Promise.all([
    readJsonl<StoredPlanningRequest>(REQUESTS_PATH),
    readJsonl<PlanningPilotEvent>(EVENTS_PATH),
  ]);
  return { requests, events, summary: summarizePlanningPilot(requests, events) };
}

function parseOptions(args: string[]): { note: string; amount?: number } {
  let note = '';
  let amount: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--note') {
      note = args[++i] || '';
    } else if (arg === '--amount') {
      const parsed = Number(args[++i]);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error('--amount must be a positive number.');
      }
      amount = parsed;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { note, amount };
}

function findState(summary: ReturnType<typeof summarizePlanningPilot>, requestId: string) {
  const state = summary.states.find((item) => item.request.id === requestId);
  if (!state) {
    throw new Error(`No planning request found for ${requestId}`);
  }
  return state;
}

function printSummary(summary: ReturnType<typeof summarizePlanningPilot>): void {
  console.log(formatPilotSummary(summary));
  if (summary.openRequestIds.length === 0) return;

  console.log('\nOpen follow-ups:');
  for (const state of summary.states.filter((item) => summary.openRequestIds.includes(item.request.id)).slice(0, 10)) {
    const request = state.request.request;
    console.log(`- ${state.request.id} | ${request.email} | ${request.dates} | ${request.party}`);
  }
}

function printList(summary: ReturnType<typeof summarizePlanningPilot>): void {
  if (summary.states.length === 0) {
    console.log('No planning requests yet.');
    return;
  }

  for (const state of summary.states) {
    const request = state.request.request;
    const markers = [
      state.paid ? 'paid' : 'unpaid',
      state.fulfilled ? 'sent' : 'not-sent',
      state.validated ? 'validated' : 'unvalidated',
      state.declined ? 'declined' : '',
    ].filter(Boolean).join(', ');

    console.log(`${state.request.id}`);
    console.log(`  ${request.email} | ${request.destination} | ${request.dates}`);
    console.log(`  ${request.party}`);
    console.log(`  ${markers}`);
    if (state.events.length > 0) {
      console.log(`  last: ${state.events.at(-1)?.type} ${state.events.at(-1)?.createdAt}`);
    }
  }
}

function printTemplate(state: ReturnType<typeof findState>): void {
  const request = state.request.request;
  console.log(`# Disney family plan: ${request.name || request.email}`);
  console.log('');
  console.log(`Request ID: ${state.request.id}`);
  console.log(`Email: ${request.email}`);
  console.log(`Destination: ${request.destination}`);
  console.log(`Dates: ${request.dates}`);
  console.log(`Hotel/resort: ${request.hotel || '(not provided)'}`);
  console.log(`Party: ${request.party}`);
  console.log(`Budget style: ${request.budget}`);
  console.log(`Priorities: ${request.priorities.join(', ')}`);
  console.log('');
  console.log('## What to book');
  console.log('');
  console.log('- ');
  console.log('');
  console.log('## What to buy or skip');
  console.log('');
  console.log('- ');
  console.log('');
  console.log('## Park rhythm');
  console.log('');
  console.log('- ');
  console.log('');
  console.log('## Dining and hotel tradeoffs');
  console.log('');
  console.log('- ');
  console.log('');
  console.log('## Backup plan');
  console.log('');
  console.log('- ');
  console.log('');
  console.log('## Source notes');
  console.log('');
  console.log(`Must-dos: ${request.mustDos || '(not provided)'}`);
  console.log(`Concerns: ${request.concerns || '(not provided)'}`);
}

async function appendEvent(requestId: string, type: string, optionArgs: string[]): Promise<void> {
  if (!isPlanningPilotEventType(type)) {
    throw new Error(`Invalid event type: ${type}`);
  }

  const { summary } = await loadPilotData();
  findState(summary, requestId);
  const options = parseOptions(optionArgs);

  const event: PlanningPilotEvent = {
    id: `evt_${randomUUID()}`,
    requestId,
    type,
    createdAt: new Date().toISOString(),
    note: options.note,
    ...(options.amount !== undefined ? { amount: options.amount } : {}),
  };

  await mkdir(PRIVATE_DIR, { recursive: true });
  await appendFile(EVENTS_PATH, `${JSON.stringify(event)}\n`, 'utf-8');
  console.log(`Recorded ${type} for ${requestId}`);
}

async function main() {
  const [command = 'summary', ...args] = process.argv.slice(2);

  try {
    if (command === 'summary') {
      const { summary } = await loadPilotData();
      printSummary(summary);
      return;
    }

    if (command === 'readiness') {
      const { summary } = await loadPilotData();
      console.log(formatPilotReadiness(getPlanningPilotReadiness(summary, process.env)));
      return;
    }

    if (command === 'list') {
      const { summary } = await loadPilotData();
      printList(summary);
      return;
    }

    if (command === 'template') {
      const [requestId] = args;
      if (!requestId) usage();
      const { summary } = await loadPilotData();
      printTemplate(findState(summary, requestId));
      return;
    }

    if (command === 'event') {
      const [requestId, type, ...optionArgs] = args;
      if (!requestId || !type) usage();
      await appendEvent(requestId, type, optionArgs);
      return;
    }

    usage();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

main();
