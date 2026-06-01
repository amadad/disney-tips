export type TipQualityReason =
  | 'too-short'
  | 'generic'
  | 'competitor-content'
  | 'merchandise'
  | 'promo'
  | 'not-actionable';

export interface TipQualityDecision {
  keep: boolean;
  reason?: TipQualityReason;
}

const GENERIC_PHRASES = [
  'arrive early',
  'plan ahead',
  'be prepared',
  'pack light',
  'stay hydrated',
  'wear comfortable',
  'download the app',
  'make a reservation',
  'book in advance',
  'check the weather',
  'bring sunscreen',
  'bring a poncho',
  'stay cool',
  'take breaks',
  'be patient',
  'have fun',
  'enjoy yourself',
  'take your time',
];

const COMPETITOR_PATTERNS = [
  /\buniversal(?:\s+(?:studios|orlando|app|parks?))?\b/i,
  /\bepic universe\b/i,
  /\bislands of adventure\b/i,
  /\bsea\s*world\b/i,
  /\bhagrid\b/i,
  /\bgringotts\b/i,
  /\bbutterbeer\b/i,
  /\bhogwarts\b/i,
];

const MERCHANDISE_PATTERNS = [
  /\b(?:is|are)\s+(?:now\s+)?available\b/i,
  /\bnew\s+(?:shirt|ears|necklace|bag|backpack|loungefly|spirit jersey|merchandise|apparel)\b/i,
  /\b(?:loungefly|spirit jerseys?|mouse ears|mickey ears|ear headbands?)\b/i,
  /\b(?:shirt|ears|jersey)\s+is\b/i,
  /\bthemed\s+(?:ears|merchandise|apparel)\b/i,
];

const PROMO_PATTERNS = [
  /\buse\s+(?:promo\s+)?code\b/i,
  /\bdiscount code\b/i,
  /\blink (?:in|below)\b/i,
  /\bsponsored\b/i,
];

const ACTIONABLE_PATTERN =
  /\b(try|get|use|ask|book|order|arrive|head|go|visit|check|grab|skip|avoid|consider|take|make sure|don't|do not|leave|request|choose)\b/i;

const DISNEY_CONTEXT_PATTERN =
  /\b(lightning lane|genie\+|rope drop|fireworks|parade|skyliner|monorail|magic kingdom|epcot|hollywood studios|animal kingdom|disney springs|disneyland|california adventure|resort|dining)\b/i;

export function getTipQualityDecision(text: string): TipQualityDecision {
  const trimmed = text.trim();
  const lowerText = trimmed.toLowerCase();

  if (trimmed.length < 50) {
    return { keep: false, reason: 'too-short' };
  }

  if (GENERIC_PHRASES.some(phrase => lowerText.includes(phrase))) {
    return { keep: false, reason: 'generic' };
  }

  if (COMPETITOR_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return { keep: false, reason: 'competitor-content' };
  }

  if (PROMO_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return { keep: false, reason: 'promo' };
  }

  if (MERCHANDISE_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return { keep: false, reason: 'merchandise' };
  }

  if (!ACTIONABLE_PATTERN.test(trimmed) && !DISNEY_CONTEXT_PATTERN.test(trimmed)) {
    return { keep: false, reason: 'not-actionable' };
  }

  return { keep: true };
}

export function isHighQualityTipText(text: string): boolean {
  return getTipQualityDecision(text).keep;
}

export function isDisneyRelevantVideoTitle(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return false;
  if (COMPETITOR_PATTERNS.some(pattern => pattern.test(trimmed))) return false;
  return true;
}

export function normalizeTipTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/['`\u2018\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeTipTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const normalized = normalizeTipTag(tag);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}
