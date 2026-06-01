export interface SearchableTip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
}

export interface TipSearchFilters {
  category?: string;
  park?: string;
}

export const DEFAULT_SEARCH_LIMIT = 100;
export const MAX_SEARCH_LIMIT = 100;

export function normalizeSearchLimit(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : DEFAULT_SEARCH_LIMIT;
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_SEARCH_LIMIT;
  return Math.min(parsed, MAX_SEARCH_LIMIT);
}

export function normalizeSearchFilter(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'all' ? trimmed : undefined;
}

export function tipMatchesCategoryPark(tip: SearchableTip, filters: TipSearchFilters): boolean {
  const matchesCategory = !filters.category || tip.category === filters.category;
  const matchesPark = !filters.park || tip.park === filters.park || tip.park === 'all-parks';
  return matchesCategory && matchesPark;
}

export function filterTipsByCategoryPark<T extends SearchableTip>(tips: T[], filters: TipSearchFilters): T[] {
  if (!filters.category && !filters.park) return tips;
  return tips.filter(tip => tipMatchesCategoryPark(tip, filters));
}

export function textSearchTipIds(
  tips: SearchableTip[],
  query: string,
  filters: TipSearchFilters = {},
  limit = DEFAULT_SEARCH_LIMIT,
): string[] {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const words = normalizedQuery.split(/\s+/).filter(word => word.length > 1);
  if (words.length === 0) return [];

  const candidates = filterTipsByCategoryPark(tips, filters);
  const scored = candidates.map(tip => {
    const text = `${tip.text} ${tip.category} ${tip.park} ${tip.tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score++;
    }
    if (text.includes(normalizedQuery)) score += words.length;
    return { id: tip.id, score };
  });

  return scored
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, normalizeSearchLimit(limit))
    .map(result => result.id);
}
