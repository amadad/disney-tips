export interface DecisionPreviewTip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
  priority: string;
  source: {
    videoId: string;
    channelName: string;
    videoTitle: string;
    publishedAt: string;
  };
  score?: number;
}

export interface DecisionArea {
  id: string;
  label: string;
  description: string;
}

export interface DecisionPreview {
  question: string;
  areas: DecisionArea[];
  results: DecisionPreviewTip[];
  planUrl: string;
}

const DECISION_AREAS: Array<DecisionArea & { patterns: RegExp[] }> = [
  {
    id: 'wait-less',
    label: 'Wait less',
    description: 'Rope drop, Lightning Lane, mobile order, and sequence choices that protect the day.',
    patterns: [/\b(wait|line|rope drop|early entry|lightning lane|multi pass|single pass|queue|crowd)\b/i],
  },
  {
    id: 'avoid-bad-spend',
    label: 'Avoid bad spend',
    description: 'Paid add-ons, hotels, dining, and ticket choices that need a worth-it call.',
    patterns: [/\b(cost|price|budget|worth|save|money|skip|buy|pay|expensive|cheap|value|hopper)\b/i],
  },
  {
    id: 'book-right-things',
    label: 'Book the right things',
    description: 'Reservation windows, dining choices, must-dos, and timing-sensitive decisions.',
    patterns: [/\b(book|reserve|reservation|dining|restaurant|character meal|must-do|must do|60 day)\b/i],
  },
  {
    id: 'protect-energy',
    label: 'Protect energy',
    description: 'Breaks, heat, naps, sensory load, rain, and tired-group backup moves.',
    patterns: [/\b(kid|kids|nap|stroller|break|rest|heat|rain|tired|meltdown|sensory|overwhelm)\b/i],
  },
  {
    id: 'hotel-transport',
    label: 'Hotel and transport fit',
    description: 'Resort, bus, Skyliner, monorail, parking, and transfer friction.',
    patterns: [/\b(hotel|resort|pop century|skyliner|monorail|bus|transport|parking|mears|minnie van)\b/i],
  },
];

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, ' ');
}

function areaMatches(area: (typeof DECISION_AREAS)[number], text: string): boolean {
  return area.patterns.some(pattern => pattern.test(text));
}

export function getDecisionAreas(question: string, tips: DecisionPreviewTip[]): DecisionArea[] {
  const combinedText = [
    question,
    ...tips.slice(0, 5).map(tip => `${tip.text} ${tip.tags.join(' ')} ${tip.category} ${tip.park}`),
  ].join(' ');
  const matched = DECISION_AREAS.filter(area => areaMatches(area, combinedText));

  if (matched.length > 0) {
    return matched.slice(0, 3).map(({ patterns: _patterns, ...area }) => area);
  }

  return DECISION_AREAS.slice(0, 3).map(({ patterns: _patterns, ...area }) => area);
}

export function buildDecisionPreview(question: string, tips: DecisionPreviewTip[]): DecisionPreview {
  const normalizedQuestion = normalizeQuestion(question);
  const results = tips.slice(0, 5);

  return {
    question: normalizedQuestion,
    areas: getDecisionAreas(normalizedQuestion, results),
    results,
    planUrl: `/plan.html?decision=${encodeURIComponent(normalizedQuestion)}#planning-request`,
  };
}
