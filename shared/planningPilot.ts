import { PLAN_PRICE, type StoredPlanningRequest } from './planningRequest.js';

export const VALIDATION_TARGET = 5;

export const PLANNING_PILOT_EVENT_TYPES = [
  'payment-requested',
  'paid',
  'plan-sent',
  'revision-requested',
  'decision-solved',
  'declined',
  'note',
] as const;

export type PlanningPilotEventType = typeof PLANNING_PILOT_EVENT_TYPES[number];

export interface PlanningPilotEvent {
  id: string;
  requestId: string;
  type: PlanningPilotEventType;
  createdAt: string;
  note: string;
  amount?: number;
}

export interface RequestPilotState {
  request: StoredPlanningRequest;
  events: PlanningPilotEvent[];
  paid: boolean;
  fulfilled: boolean;
  validated: boolean;
  declined: boolean;
  latestEventAt: string;
}

export interface PlanningPilotSummary {
  totalRequests: number;
  paidRequests: number;
  fulfilledRequests: number;
  validatedRequests: number;
  declinedRequests: number;
  openRequestIds: string[];
  remainingToValidation: number;
  validationMet: boolean;
  states: RequestPilotState[];
}

export interface PlanningPilotReadiness {
  readyForOutreach: boolean;
  emailNotifications: 'configured' | 'missing';
  paymentCollection: 'payment-link' | 'manual-follow-up';
  warnings: string[];
  summary: Pick<
    PlanningPilotSummary,
    'totalRequests' | 'validatedRequests' | 'remainingToValidation' | 'validationMet'
  >;
}

type PlanningPilotEnv = Partial<Record<
  'RESEND_API_KEY' | 'PLAN_REQUEST_RECIPIENT' | 'RESEND_FROM_EMAIL' | 'PLAN_PAYMENT_URL',
  string | undefined
>>;

const EVENT_TYPE_SET = new Set<string>(PLANNING_PILOT_EVENT_TYPES);

export function isPlanningPilotEventType(value: string): value is PlanningPilotEventType {
  return EVENT_TYPE_SET.has(value);
}

export function summarizePlanningPilot(
  requests: StoredPlanningRequest[],
  events: PlanningPilotEvent[],
): PlanningPilotSummary {
  const eventsByRequest = new Map<string, PlanningPilotEvent[]>();
  for (const event of events) {
    const existing = eventsByRequest.get(event.requestId) || [];
    existing.push(event);
    eventsByRequest.set(event.requestId, existing);
  }

  const states = requests
    .map((request) => {
      const requestEvents = (eventsByRequest.get(request.id) || [])
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const eventTypes = new Set(requestEvents.map((event) => event.type));
      const paid = eventTypes.has('paid');
      const fulfilled = eventTypes.has('plan-sent');
      const declined = eventTypes.has('declined');
      const validated = paid || eventTypes.has('decision-solved');
      const latestEventAt = requestEvents.at(-1)?.createdAt || request.createdAt;

      return {
        request,
        events: requestEvents,
        paid,
        fulfilled,
        validated,
        declined,
        latestEventAt,
      };
    })
    .sort((a, b) => b.latestEventAt.localeCompare(a.latestEventAt));

  const paidRequests = states.filter((state) => state.paid).length;
  const fulfilledRequests = states.filter((state) => state.fulfilled).length;
  const validatedRequests = states.filter((state) => state.validated).length;
  const declinedRequests = states.filter((state) => state.declined).length;
  const openRequestIds = states
    .filter((state) => !state.validated && !state.declined)
    .map((state) => state.request.id);
  const remainingToValidation = Math.max(VALIDATION_TARGET - validatedRequests, 0);

  return {
    totalRequests: requests.length,
    paidRequests,
    fulfilledRequests,
    validatedRequests,
    declinedRequests,
    openRequestIds,
    remainingToValidation,
    validationMet: validatedRequests >= VALIDATION_TARGET,
    states,
  };
}

export function formatPilotSummary(summary: PlanningPilotSummary): string {
  return [
    `Requests: ${summary.totalRequests}`,
    `Paid: ${summary.paidRequests}`,
    `Plans sent: ${summary.fulfilledRequests}`,
    `Validated: ${summary.validatedRequests}/${VALIDATION_TARGET}`,
    `Declined: ${summary.declinedRequests}`,
    `Open follow-ups: ${summary.openRequestIds.length}`,
    summary.validationMet
      ? 'Validation met: yes'
      : `Validation met: no (${summary.remainingToValidation} more needed)`,
  ].join('\n');
}

function hasEnvValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function getPlanningPilotReadiness(
  summary: PlanningPilotSummary,
  env: PlanningPilotEnv,
): PlanningPilotReadiness {
  const hasResendKey = hasEnvValue(env.RESEND_API_KEY);
  const hasRecipient = hasEnvValue(env.PLAN_REQUEST_RECIPIENT);
  const hasPaymentUrl = hasEnvValue(env.PLAN_PAYMENT_URL);
  const warnings: string[] = [];

  if (!hasResendKey) {
    warnings.push('RESEND_API_KEY is missing, so planning request emails cannot be sent.');
  }
  if (!hasRecipient) {
    warnings.push('PLAN_REQUEST_RECIPIENT is missing, so new planning requests will only be stored in data/private.');
  }
  if (!hasEnvValue(env.RESEND_FROM_EMAIL)) {
    warnings.push('RESEND_FROM_EMAIL is missing; the server will use the default Disney Plans sender.');
  }
  if (!hasPaymentUrl) {
    warnings.push(`PLAN_PAYMENT_URL is missing; collect the $${PLAN_PRICE} payment by manual follow-up.`);
  }

  return {
    readyForOutreach: hasResendKey && hasRecipient,
    emailNotifications: hasResendKey && hasRecipient ? 'configured' : 'missing',
    paymentCollection: hasPaymentUrl ? 'payment-link' : 'manual-follow-up',
    warnings,
    summary: {
      totalRequests: summary.totalRequests,
      validatedRequests: summary.validatedRequests,
      remainingToValidation: summary.remainingToValidation,
      validationMet: summary.validationMet,
    },
  };
}

export function formatPilotReadiness(readiness: PlanningPilotReadiness): string {
  const lines = [
    `Ready for outreach: ${readiness.readyForOutreach ? 'yes' : 'no'}`,
    `Email notifications: ${readiness.emailNotifications}`,
    `Payment collection: ${readiness.paymentCollection}`,
    `Requests: ${readiness.summary.totalRequests}`,
    `Validated: ${readiness.summary.validatedRequests}/${VALIDATION_TARGET}`,
  ];

  if (readiness.warnings.length > 0) {
    lines.push('', 'Warnings:');
    for (const warning of readiness.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join('\n');
}
