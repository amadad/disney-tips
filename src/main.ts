import type { Tip, TipsData, Park } from './types';
import { PARK_LABELS, PRIORITY_ICONS, SEASON_LABELS } from './types';

// Clipboard helper with fallback for older browsers/insecure contexts
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

// Filter option configurations
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'parks', label: 'Parks' },
  { id: 'dining', label: 'Dining' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'budget', label: 'Budget' },
  { id: 'planning', label: 'Planning' },
  { id: 'transportation', label: 'Transport' },
];

const PARKS = [
  { id: 'all', label: 'All Parks' },
  { id: 'magic-kingdom', label: 'Magic Kingdom' },
  { id: 'epcot', label: 'EPCOT' },
  { id: 'hollywood-studios', label: 'Hollywood Studios' },
  { id: 'animal-kingdom', label: 'Animal Kingdom' },
  { id: 'disney-springs', label: 'Disney Springs' },
  { id: 'water-parks', label: 'Water Parks' },
  { id: 'disneyland', label: 'Disneyland' },
  { id: 'california-adventure', label: 'California Adventure' },
];

// Configuration
const TIPS_PER_PAGE = 50;
const SEARCH_DEBOUNCE_MS = 300;

// State
let allTips: Tip[] = [];
let topTipIds: Set<string> = new Set();
let currentCategory = 'all';
let currentPark = 'all';
let searchQuery = '';
let currentPage = 1;
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let isSemanticSearching = false;
let semanticResults: Tip[] | null = null; // null = not searching, [] = no results

// Client-side embeddings for vector search
let tipEmbeddings: Map<string, Float32Array> | null = null;
let embeddingsLoading = false;

// URL parameter helpers
function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function updateUrl(): void {
  const params = new URLSearchParams();
  if (currentCategory !== 'all') params.set('category', currentCategory);
  if (currentPark !== 'all') params.set('park', currentPark);
  if (searchQuery) params.set('q', searchQuery);
  if (currentPage > 1) params.set('page', String(currentPage));

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

function loadFromUrl(): boolean {
  const params = getUrlParams();

  // Check for direct tip link first
  const tipId = params.get('tip');
  if (tipId) {
    showSingleTip(tipId);
    return true;
  }

  currentCategory = params.get('category') || 'all';
  currentPark = params.get('park') || 'all';
  searchQuery = params.get('q') || '';
  const pageParam = parseInt(params.get('page') || '1', 10);
  currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }

  return false;
}

// Show a single tip by ID (for deep linking)
function showSingleTip(tipId: string): void {
  const tip = allTips.find(t => t.id === tipId);
  if (!tip) {
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  currentCategory = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';

  const container = document.getElementById('tips-container')!;
  const paginationEl = document.getElementById('pagination');
  const resultsEl = document.getElementById('results-count');

  if (paginationEl) paginationEl.innerHTML = '';
  if (resultsEl) resultsEl.textContent = 'Viewing shared tip';

  container.className = 'search-results';
  container.innerHTML = `<div style="text-align:center;margin-bottom:1.5rem"><a href="${window.location.pathname}" class="back-link">&larr; View all tips</a></div>` + renderTipCard(tip, { highlight: true });
}

function hasActiveFilters(): boolean {
  return currentCategory !== 'all' ||
         currentPark !== 'all' ||
         searchQuery !== '';
}

function clearAllFilters(): void {
  currentCategory = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';
  semanticResults = null;

  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput) searchInput.value = '';

  window.history.replaceState({}, '', window.location.pathname);

  renderFilters();
  renderTips();
  showSuggested(true);
}

async function loadTips(): Promise<void> {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'tips.json');
    const data: TipsData = await response.json();

    allTips = data.tips;
    topTipIds = new Set(data.topTips || []);

    // Start loading embeddings in background for client-side search
    loadEmbeddings();

    const lastUpdatedDate = new Date(data.lastUpdated);

    document.getElementById('tip-count')!.textContent = `${data.totalTips} tips`;
    document.getElementById('last-updated')!.textContent =
      `Updated ${lastUpdatedDate.toLocaleDateString()}`;

    const isSingleTipView = loadFromUrl();
    renderFilters();
    if (!isSingleTipView) {
      // If URL has a query, trigger semantic search
      if (searchQuery) {
        performSemanticSearch(searchQuery);
      } else {
        renderTips();
      }
    }
  } catch (error) {
    console.error('Failed to load tips:', error);
    document.getElementById('tips-container')!.innerHTML =
      '<div class="no-results">Failed to load tips. Please try refreshing the page.</div>';
  }
}

// Lazy-load embeddings for client-side vector search
async function loadEmbeddings(): Promise<void> {
  if (tipEmbeddings || embeddingsLoading) return;
  embeddingsLoading = true;
  try {
    const res = await fetch('/data/public/embeddings.json');
    if (!res.ok) throw new Error(`${res.status}`);
    const entries: { tipId: string; vector: number[] }[] = await res.json();
    const map = new Map<string, Float32Array>();
    for (const e of entries) {
      map.set(e.tipId, new Float32Array(e.vector));
    }
    tipEmbeddings = map;
    console.log(`Loaded ${map.size} embeddings (${entries[0]?.vector.length}-dim)`);
  } catch (err) {
    console.warn('Failed to load embeddings, will use server search:', err);
  } finally {
    embeddingsLoading = false;
  }
}

function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic search — client-side if embeddings loaded, server fallback
async function performSemanticSearch(query: string): Promise<void> {
  if (!query.trim()) {
    semanticResults = null;
    isSemanticSearching = false;
    renderTips();
    return;
  }

  isSemanticSearching = true;
  renderSearchLoading();

  try {
    // Try client-side vector search if embeddings are loaded
    if (tipEmbeddings && tipEmbeddings.size > 0) {
      const res = await fetch('/api/embed-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error(`Embed query failed: ${res.status}`);

      const { vector } = await res.json();
      const queryVec = new Float32Array(vector);
      const tipMap = new Map(allTips.map(t => [t.id, t]));

      const scored: { tip: Tip; score: number }[] = [];
      for (const [tipId, vec] of tipEmbeddings) {
        const tip = tipMap.get(tipId);
        if (tip) {
          scored.push({ tip, score: cosineSimilarity(queryVec, vec) });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      semanticResults = scored.slice(0, 20).map(s => s.tip);
    } else {
      // Fallback: server-side search (embeddings not yet loaded)
      const res = await fetch('/api/search?enrich=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error(`Search failed: ${res.status}`);

      const data = await res.json();
      semanticResults = data.results || [];
    }
  } catch (err) {
    console.error('Semantic search failed, falling back to text:', err);
    semanticResults = clientSideSearch(query);
  } finally {
    isSemanticSearching = false;
    renderTips();
  }
}

// Client-side fallback search
function clientSideSearch(query: string): Tip[] {
  const searchLower = query.toLowerCase();
  return allTips.filter(tip =>
    tip.text.toLowerCase().includes(searchLower) ||
    tip.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
    (tip.park && PARK_LABELS[tip.park]?.toLowerCase().includes(searchLower))
  ).slice(0, 30);
}

function renderSearchLoading(): void {
  const container = document.getElementById('tips-container')!;
  const resultsEl = document.getElementById('results-count');
  if (resultsEl) resultsEl.innerHTML = '<span class="search-spinner"></span> Searching...';
  container.className = 'search-results';
  container.innerHTML = '';
}

function getTopTips(): Tip[] {
  if (topTipIds.size === 0) return allTips.slice(0, 101);
  return allTips.filter(tip => topTipIds.has(tip.id)).slice(0, 101);
}

function applyPostFilters(tips: Tip[]): Tip[] {
  return tips.filter(tip => {
    const matchesCategory = currentCategory === 'all' || tip.category === currentCategory;
    const matchesPark = currentPark === 'all' || tip.park === currentPark || tip.park === 'all-parks';
    return matchesCategory && matchesPark;
  });
}

function renderFilters(): void {
  const container = document.getElementById('filter-scroll');
  if (!container) return;

  const parts: string[] = [];

  // Category pills
  for (const cat of CATEGORIES) {
    parts.push(`<button class="pill${cat.id === currentCategory ? ' active' : ''}" data-category="${cat.id}">${cat.label}</button>`);
  }

  // Separator
  parts.push('<span class="pill-sep"></span>');

  // Park dropdown
  parts.push(`<select id="park-select" class="filter-select" aria-label="Filter by Park">${PARKS.map(p =>
    `<option value="${p.id}"${p.id === currentPark ? ' selected' : ''}>${p.label}</option>`
  ).join('')}</select>`);

  // Clear button (only if filters active)
  if (hasActiveFilters()) {
    parts.push('<button id="clear-filters-btn" class="clear-btn">Clear</button>');
  }

  container.innerHTML = parts.join('');
}

function setupFilterListeners(): void {
  const filterBar = document.getElementById('filter-bar');
  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const pill = target.closest('.pill') as HTMLElement | null;
      if (!pill) {
        if (target.closest('.clear-btn')) {
          clearAllFilters();
        }
        return;
      }

      const category = pill.getAttribute('data-category');
      if (category !== null) {
        currentCategory = category;
      }

      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    });

    filterBar.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === 'park-select') {
        currentPark = target.value;
        currentPage = 1;
        updateUrl();
        renderFilters();
        renderTips();
      }
    });
  }

  // Load more button
  document.getElementById('pagination')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('#load-more');
    if (!btn) return;
    currentPage += 1;
    updateUrl();
    renderTips();
  });

  // Copy and Share button delegation
  document.getElementById('tips-container')!.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const copyBtn = target.closest('.action-btn.copy');
    if (copyBtn) {
      const card = copyBtn.closest('.tip-card, .compact-card');
      const text = card?.querySelector('.tip-text, .compact-text')?.textContent || '';
      const success = await copyToClipboard(text);
      showToast(success ? 'Copied to clipboard' : 'Failed to copy');
      return;
    }

    const shareBtn = target.closest('.action-btn.share');
    if (shareBtn) {
      const tipId = shareBtn.getAttribute('data-tip-id');
      if (tipId) shareTip(tipId);
    }
  });

  // Suggested search pills
  document.getElementById('suggested-searches')?.addEventListener('click', (e) => {
    const pill = (e.target as HTMLElement).closest('.suggested-pill') as HTMLElement | null;
    if (!pill) return;
    const query = pill.getAttribute('data-query') || '';
    if (!query) return;

    const searchInput = document.getElementById('search') as HTMLInputElement;
    if (searchInput) searchInput.value = query;

    searchQuery = query;
    currentPage = 1;
    updateUrl();
    renderFilters();
    showSuggested(false);
    performSemanticSearch(query);
  });
}

function showToast(message = 'Copied to clipboard') {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function showSuggested(show: boolean): void {
  const el = document.getElementById('suggested-searches');
  if (el) el.style.display = show ? '' : 'none';
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function formatSeason(season: string): string {
  return SEASON_LABELS[season as keyof typeof SEASON_LABELS] || season;
}

// Full tip card — used for top tips / browse mode
function renderTipCard(tip: Tip, options: { highlight?: boolean; searchQuery?: string } = {}): string {
  const { highlight = false, searchQuery: query = '' } = options;
  const highlightedText = query ? highlightText(tip.text, query) : escapeHtml(tip.text);

  return `
    <div class="tip-card priority-${tip.priority}${highlight ? ' random-highlight' : ''}" data-id="${tip.id}" tabindex="0">
      <div class="card-actions">
        <button class="action-btn copy" title="Copy tip (c)" aria-label="Copy tip to clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="action-btn share" title="Share tip (s)" aria-label="Share tip" data-tip-id="${tip.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>
      <div class="tip-header">
        <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
        ${tip.season !== 'year-round' ? `<span class="season-badge">${formatSeason(tip.season)}</span>` : ''}
      </div>
      <p class="tip-text">${highlightedText}</p>
      <div class="tip-meta">
        <span class="tag category-tag ${tip.category}">${tip.category}</span>
        ${tip.park && tip.park !== 'all-parks' ? `<span class="tag park-tag">${PARK_LABELS[tip.park] || tip.park}</span>` : ''}
        ${tip.tags.slice(0, 2).map(tag => `<span class="tag">${query ? highlightText(tag, query) : escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="tip-source">
        From <a href="https://youtube.com/watch?v=${tip.source.videoId}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(tip.source.channelName)}
        </a>
        &middot; ${new Date(tip.source.publishedAt).toLocaleDateString()}
      </div>
    </div>
  `;
}

// Compact card — used for search results
function renderCompactCard(tip: Tip, query = ''): string {
  const highlightedText = query ? highlightText(tip.text, query) : escapeHtml(tip.text);

  return `
    <div class="compact-card" data-id="${tip.id}" tabindex="0">
      <div class="card-actions">
        <button class="action-btn copy" title="Copy tip (c)" aria-label="Copy tip to clipboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="action-btn share" title="Share tip (s)" aria-label="Share tip" data-tip-id="${tip.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>
      <p class="compact-text">${highlightedText}</p>
      <div class="compact-meta">
        <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
        <span class="meta-sep">&middot;</span>
        <span class="category-tag">${tip.category}</span>
        ${tip.park && tip.park !== 'all-parks' ? `<span class="meta-sep">&middot;</span><span>${PARK_LABELS[tip.park] || tip.park}</span>` : ''}
        <span class="meta-sep">&middot;</span>
        <a class="source-link" href="https://youtube.com/watch?v=${tip.source.videoId}" target="_blank" rel="noopener noreferrer">${escapeHtml(tip.source.channelName)}</a>
        <span class="meta-sep">&middot;</span>
        <span>${new Date(tip.source.publishedAt).toLocaleDateString()}</span>
      </div>
    </div>
  `;
}

function renderLoadMore(totalItems: number, visibleCount: number): void {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  if (visibleCount >= totalItems) {
    paginationEl.innerHTML = '';
    return;
  }

  paginationEl.innerHTML = `
    <button class="load-more" id="load-more">More tips (${visibleCount} of ${totalItems})</button>
  `;
}

function renderTips(): void {
  const container = document.getElementById('tips-container')!;
  const resultsEl = document.getElementById('results-count');
  const paginationEl = document.getElementById('pagination');

  // SEARCH MODE: semantic results available
  if (searchQuery && semanticResults !== null) {
    const filtered = applyPostFilters(semanticResults);
    const visibleCount = Math.min(filtered.length, currentPage * TIPS_PER_PAGE);
    const visibleTips = filtered.slice(0, visibleCount);

    if (resultsEl) {
      resultsEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${searchQuery}"`;
    }

    container.className = 'search-results';

    if (filtered.length === 0) {
      container.innerHTML = `<div class="no-results">No tips found for "${escapeHtml(searchQuery)}". Try a different search.</div>`;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    container.innerHTML = visibleTips.map(tip =>
      renderCompactCard(tip, searchQuery)
    ).join('');

    renderLoadMore(filtered.length, visibleCount);
    return;
  }

  // BROWSE MODE: top tips / category browsing
  container.className = 'tips-grid';

  let tips: Tip[];
  let heading: string;

  if (currentCategory === 'all' && currentPark === 'all') {
    tips = getTopTips();
    heading = `Top ${tips.length} Tips`;
  } else {
    tips = applyPostFilters(allTips);
    heading = '';
  }

  const totalPages = Math.max(1, Math.ceil(tips.length / TIPS_PER_PAGE));
  if (currentPage > totalPages) {
    currentPage = totalPages;
    updateUrl();
  }

  const visibleCount = Math.min(tips.length, currentPage * TIPS_PER_PAGE);
  const visibleTips = tips.slice(0, visibleCount);

  if (resultsEl) {
    resultsEl.textContent = heading
      ? heading
      : `Showing ${visibleCount} of ${tips.length} tips`;
  }

  renderLoadMore(tips.length, visibleCount);

  if (tips.length === 0) {
    const suggestion = hasActiveFilters()
      ? 'Try clearing filters or broadening your search.'
      : 'Try a different search term.';
    container.innerHTML = `<div class="no-results">No tips found. ${suggestion}</div>`;
    return;
  }

  container.innerHTML = visibleTips.map(tip =>
    renderTipCard(tip)
  ).join('');
}

function showRandomTip(): void {
  if (allTips.length === 0) return;

  const randomIndex = Math.floor(Math.random() * allTips.length);
  const tip = allTips[randomIndex];

  currentCategory = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';
  semanticResults = null;

  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput) searchInput.value = '';

  window.history.replaceState({}, '', window.location.pathname);

  renderFilters();
  showSuggested(true);

  const paginationEl = document.getElementById('pagination');
  if (paginationEl) paginationEl.innerHTML = '';

  const container = document.getElementById('tips-container')!;
  const resultsEl = document.getElementById('results-count');
  if (resultsEl) resultsEl.textContent = 'Random tip';
  container.className = 'search-results';
  container.innerHTML = renderTipCard(tip, { highlight: true });
}

// Hide prerendered tips once JS is ready
function hidePrerendered() {
  const el = document.getElementById('prerendered-tips');
  if (el) el.style.display = 'none';
}

// Email signup handler
function setupEmailSignup() {
  const form = document.getElementById('email-signup') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[name="email"]') as HTMLInputElement;
    const btn = form.querySelector('button') as HTMLButtonElement;
    const msg = document.getElementById('signup-msg')!;
    const email = input.value.trim();
    if (!email) return;

    btn.disabled = true;
    msg.textContent = '';
    msg.className = 'signup-msg';

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        msg.textContent = '✓ You\'re in! Check your inbox.';
        msg.className = 'signup-msg success';
        input.value = '';
      } else {
        msg.textContent = data.error || 'Something went wrong.';
        msg.className = 'signup-msg error';
      }
    } catch {
      msg.textContent = 'Network error. Try again.';
      msg.className = 'signup-msg error';
    } finally {
      btn.disabled = false;
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  hidePrerendered();
  loadTips();
  setupFilterListeners();
  setupEmailSignup();

  // Debounced search
  const searchInput = document.getElementById('search') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchQuery = value;
      currentPage = 1;
      updateUrl();
      renderFilters();

      if (value.trim()) {
        showSuggested(false);
        performSemanticSearch(value);
      } else {
        semanticResults = null;
        showSuggested(true);
        renderTips();
      }
    }, SEARCH_DEBOUNCE_MS);
  });

  // Random tip button
  const randomBtn = document.getElementById('random-tip-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', showRandomTip);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (searchTimeout) clearTimeout(searchTimeout);
});

// Keyboard navigation (j/k for next/prev tip, / to focus search)
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  const cards = document.querySelectorAll('.tip-card, .compact-card');
  if (cards.length === 0 && !['/', 'r'].includes(e.key)) return;

  const focusedCard = document.querySelector('.tip-card:focus, .compact-card:focus') as HTMLElement | null;
  let currentIndex = focusedCard ? Array.from(cards).indexOf(focusedCard) : -1;

  switch (e.key) {
    case 'j':
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, cards.length - 1);
      (cards[currentIndex] as HTMLElement).focus();
      (cards[currentIndex] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;

    case 'k':
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      (cards[currentIndex] as HTMLElement).focus();
      (cards[currentIndex] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;

    case '/':
      e.preventDefault();
      document.getElementById('search')?.focus();
      break;

    case 'Escape':
      if (document.activeElement === document.getElementById('search')) {
        (document.activeElement as HTMLElement).blur();
      }
      break;

    case 'r':
      showRandomTip();
      break;

    case 'c':
      if (focusedCard) {
        e.preventDefault();
        const text = focusedCard.querySelector('.tip-text, .compact-text')?.textContent || '';
        copyToClipboard(text).then(success => {
          showToast(success ? 'Copied to clipboard' : 'Failed to copy');
        });
      }
      break;

    case 's':
      if (focusedCard) {
        e.preventDefault();
        const tipId = focusedCard.getAttribute('data-id');
        if (tipId) shareTip(tipId);
      }
      break;
  }
});

// Share tip functionality
function shareTip(tipId: string): void {
  const tip = allTips.find(t => t.id === tipId);
  if (!tip) return;

  const shareUrl = `${window.location.origin}${window.location.pathname}?tip=${tipId}`;
  const shareText = `Disney Parks Tip: ${tip.text}`;

  if (navigator.share) {
    navigator.share({
      title: 'Disney Parks Tip',
      text: shareText,
      url: shareUrl,
    }).catch(() => {
      copyShareLink(shareUrl);
    });
  } else {
    copyShareLink(shareUrl);
  }
}

function copyShareLink(url: string): void {
  copyToClipboard(url).then(success => {
    showToast(success ? 'Link copied!' : 'Failed to copy link');
  });
}
