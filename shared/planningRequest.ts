export const PLAN_PRICE = 39;

export const PLAN_DESTINATIONS = [
  { id: 'walt-disney-world', label: 'Walt Disney World' },
  { id: 'disneyland', label: 'Disneyland' },
  { id: 'not-sure', label: 'Not sure yet' },
] as const;

export const PLAN_BUDGETS = [
  { id: 'save-aggressively', label: 'Save aggressively' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'spend-to-save-time', label: 'Spend to save time' },
] as const;

export const PLAN_PRIORITIES = [
  { id: 'wait-less', label: 'Wait less' },
  { id: 'save-money', label: 'Avoid bad spend' },
  { id: 'book-right-things', label: 'Book the right things' },
  { id: 'lightning-lane', label: 'Lightning Lane choices' },
  { id: 'dining', label: 'Dining reservations' },
  { id: 'kids-energy', label: 'Kids, naps, heat, or sensory needs' },
  { id: 'transportation', label: 'Hotel and transportation fit' },
  { id: 'backup-plans', label: 'Rain and meltdown backups' },
] as const;

export type PlanningDestination = typeof PLAN_DESTINATIONS[number]['id'];
export type PlanningBudget = typeof PLAN_BUDGETS[number]['id'];
export type PlanningPriority = typeof PLAN_PRIORITIES[number]['id'];

export interface PlanningRequestPayload {
  name: string;
  email: string;
  destination: PlanningDestination;
  dates: string;
  hotel: string;
  party: string;
  budget: PlanningBudget;
  priorities: PlanningPriority[];
  mustDos: string;
  concerns: string;
}

export interface StoredPlanningRequest {
  id: string;
  createdAt: string;
  ip: string;
  userAgent: string;
  request: PlanningRequestPayload;
}

export interface PlanningRequestResponse {
  ok: true;
  id: string;
  price: typeof PLAN_PRICE;
  message: string;
  paymentUrl?: string;
}

type ParseResult =
  | { ok: true; value: PlanningRequestPayload }
  | { ok: false; status: number; error: string };

const DESTINATION_IDS = new Set<string>(PLAN_DESTINATIONS.map((item) => item.id));
const BUDGET_IDS = new Set<string>(PLAN_BUDGETS.map((item) => item.id));
const PRIORITY_IDS = new Set<string>(PLAN_PRIORITIES.map((item) => item.id));

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanLongText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parsePlanningRequest(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Planning request is required.' };
  }

  const input = body as Record<string, unknown>;
  if (input.consent !== true) {
    return { ok: false, status: 400, error: 'Consent is required before requesting a plan.' };
  }

  const email = cleanString(input.email, 254).toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, status: 400, error: 'Valid email required.' };
  }

  const destination = cleanString(input.destination, 40);
  if (!DESTINATION_IDS.has(destination)) {
    return { ok: false, status: 400, error: 'Choose a valid destination.' };
  }

  const dates = cleanString(input.dates, 120);
  if (dates.length < 3) {
    return { ok: false, status: 400, error: 'Trip dates are required.' };
  }

  const party = cleanString(input.party, 220);
  if (party.length < 5) {
    return { ok: false, status: 400, error: 'Tell us who is traveling.' };
  }

  const budget = cleanString(input.budget, 40);
  if (!BUDGET_IDS.has(budget)) {
    return { ok: false, status: 400, error: 'Choose a valid budget style.' };
  }

  if (!Array.isArray(input.priorities)) {
    return { ok: false, status: 400, error: 'Choose at least one planning priority.' };
  }

  const priorities = Array.from(new Set(input.priorities.map((item) => cleanString(item, 60))));
  if (priorities.length === 0 || priorities.length > PLAN_PRIORITIES.length) {
    return { ok: false, status: 400, error: 'Choose at least one planning priority.' };
  }
  if (priorities.some((priority) => !PRIORITY_IDS.has(priority))) {
    return { ok: false, status: 400, error: 'Choose a valid planning priority.' };
  }

  return {
    ok: true,
    value: {
      name: cleanString(input.name, 120),
      email,
      destination: destination as PlanningDestination,
      dates,
      hotel: cleanString(input.hotel, 180),
      party,
      budget: budget as PlanningBudget,
      priorities: priorities as PlanningPriority[],
      mustDos: cleanLongText(input.mustDos, 1200),
      concerns: cleanLongText(input.concerns, 1200),
    },
  };
}

export function formatPlanningRequestEmail(record: StoredPlanningRequest): string {
  const request = record.request;
  return [
    `Plan request ${record.id}`,
    `Created: ${record.createdAt}`,
    `Launch offer: $${PLAN_PRICE} custom family plan`,
    '',
    `Name: ${request.name || '(not provided)'}`,
    `Email: ${request.email}`,
    `Destination: ${request.destination}`,
    `Dates: ${request.dates}`,
    `Hotel/resort: ${request.hotel || '(not provided)'}`,
    `Party: ${request.party}`,
    `Budget style: ${request.budget}`,
    `Priorities: ${request.priorities.join(', ')}`,
    '',
    `Must-dos: ${request.mustDos || '(not provided)'}`,
    '',
    `Concerns: ${request.concerns || '(not provided)'}`,
    '',
    `IP: ${record.ip}`,
    `User agent: ${record.userAgent}`,
  ].join('\n');
}

export function buildPlanningRequestResponse(id: string, paymentUrl?: string): PlanningRequestResponse {
  const trimmedPaymentUrl = paymentUrl?.trim();
  if (trimmedPaymentUrl) {
    return {
      ok: true,
      id,
      price: PLAN_PRICE,
      paymentUrl: trimmedPaymentUrl,
      message: `Request received. Use the payment link to reserve the $${PLAN_PRICE} family plan.`,
    };
  }

  return {
    ok: true,
    id,
    price: PLAN_PRICE,
    message: `Request received. I will review it and follow up about the $${PLAN_PRICE} family plan.`,
  };
}
