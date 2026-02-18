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
  // Legacy fallback using execCommand
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

const PRIORITIES = [
  { id: 'all', label: 'All Impact' },
  { id: 'high', label: 'High Impact' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Nice to Know' },
];

const SEASONS = [
  { id: 'all', label: 'Any Season' },
  { id: 'year-round', label: 'Year Round' },
  { id: 'christmas', label: 'Christmas' },
  { id: 'halloween', label: 'Halloween' },
  { id: 'flower-garden', label: 'Flower & Garden' },
  { id: 'food-wine', label: 'Food & Wine' },
  { id: 'festival-arts', label: 'Festival of Arts' },
  { id: 'summer', label: 'Summer' },
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

// Sort options
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'priority', label: 'Highest Priority' },
  { id: 'oldest', label: 'Oldest First' },
];

// State
let allTips: Tip[] = [];
let topTipIds: Set<string> = new Set();
let currentView: 'top' | 'all' = 'top'; // Default to top tips
let currentSort = 'newest';
let currentCategory = 'all';
let currentPriority = 'all';
let currentSeason = 'all';
let currentPark = 'all';
let searchQuery = '';
let currentPage = 1;
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let isSemanticSearching = false;

// URL parameter helpers
function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function updateUrl(): void {
  const params = new URLSearchParams();
  if (currentView !== 'top') params.set('view', currentView);
  if (currentSort !== 'newest') params.set('sort', currentSort);
  if (currentCategory !== 'all') params.set('category', currentCategory);
  if (currentPriority !== 'all') params.set('priority', currentPriority);
  if (currentSeason !== 'all') params.set('season', currentSeason);
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
    return true; // Signal that single tip view is active
  }

  const viewParam = params.get('view');
  currentView = viewParam === 'all' ? 'all' : 'top';

  const sortParam = params.get('sort');
  currentSort = SORT_OPTIONS.some(opt => opt.id === sortParam) ? (sortParam as string) : 'newest';

  currentCategory = params.get('category') || 'all';
  currentPriority = params.get('priority') || 'all';
  currentSeason = params.get('season') || 'all';
  currentPark = params.get('park') || 'all';
  searchQuery = params.get('q') || '';
  const pageParam = parseInt(params.get('page') || '1', 10);
  currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  // Update search input if there's a query
  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }

  return false; // Normal list view
}

// Show a single tip by ID (for deep linking)
function showSingleTip(tipId: string): void {
  const tip = allTips.find(t => t.id === tipId);
  if (!tip) {
    // Tip not found, fall back to normal view
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  // Reset all filters
  currentCategory = 'all';
  currentPriority = 'all';
  currentSeason = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';

  const container = document.getElementById('tips-container')!;
  const paginationEl = document.getElementById('pagination');
  const resultsEl = document.getElementById('results-count');

  if (paginationEl) paginationEl.innerHTML = '';
  if (resultsEl) resultsEl.textContent = 'Viewing shared tip';

  container.innerHTML = `<div style="text-align:center;margin-bottom:1.5rem"><a href="${window.location.pathname}" class="back-link">&larr; View all tips</a></div>` + renderTipCard(tip, { highlight: true });
}

function hasActiveFilters(): boolean {
  return currentView !== 'top' ||
         currentSort !== 'newest' ||
         currentCategory !== 'all' ||
         currentPriority !== 'all' ||
         currentSeason !== 'all' ||
         currentPark !== 'all' ||
         searchQuery !== '';
}

function clearAllFilters(): void {
  currentView = 'top';
  currentSort = 'newest';
  currentCategory = 'all';
  currentPriority = 'all';
  currentSeason = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';

  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput) searchInput.value = '';

  window.history.replaceState({}, '', window.location.pathname);

  renderFilters();
  renderTips();
}

async function loadTips(): Promise<void> {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'tips.json');
    const data: TipsData = await response.json();

    allTips = data.tips;
    topTipIds = new Set(data.topTips || []);

    const lastUpdatedDate = new Date(data.lastUpdated);

    document.getElementById('tip-count')!.textContent = `${data.totalTips} tips`;
    document.getElementById('last-updated')!.textContent =
      `Updated ${lastUpdatedDate.toLocaleDateString()}`;

    // Calculate next update (cron runs daily at 6 AM UTC)
    const nextUpdateEl = document.getElementById('next-update');
    if (nextUpdateEl) {
      const now = new Date();
      const nextUpdate = new Date(now);
      nextUpdate.setUTCHours(6, 0, 0, 0);
      if (now.getUTCHours() >= 6) {
        nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
      }
      const nextUpdateLabel = nextUpdate.toLocaleString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      nextUpdateEl.textContent = `Next update ${nextUpdateLabel} UTC`;
    }

    const isSingleTipView = loadFromUrl();
    renderFilters();
    if (!isSingleTipView) {
      renderTips();
    }
  } catch (error) {
    console.error('Failed to load tips:', error);
    document.getElementById('tips-container')!.innerHTML =
      '<div class="no-results">Failed to load tips. Please try refreshing the page.</div>';
  }
}

function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = { all: allTips.length };
  for (const tip of allTips) {
    counts[tip.category] = (counts[tip.category] || 0) + 1;
  }
  return counts;
}

function renderFilters(): void {
  const container = document.getElementById('filter-scroll');
  if (!container) return;

  const parts: string[] = [];

  // View pills
  parts.push(`<button class="pill${currentView === 'top' ? ' active' : ''}" data-view="top">Top</button>`);
  parts.push(`<button class="pill${currentView === 'all' ? ' active' : ''}" data-view="all">All</button>`);

  // Separator
  parts.push('<span class="pill-sep"></span>');

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

  // Priority dropdown
  parts.push(`<select id="priority-select" class="filter-select" aria-label="Filter by Impact">${PRIORITIES.map(p =>
    `<option value="${p.id}"${p.id === currentPriority ? ' selected' : ''}>${p.label}</option>`
  ).join('')}</select>`);

  // Season dropdown
  parts.push(`<select id="season-select" class="filter-select" aria-label="Filter by Season">${SEASONS.map(s =>
    `<option value="${s.id}"${s.id === currentSeason ? ' selected' : ''}>${s.label}</option>`
  ).join('')}</select>`);

  // Sort dropdown
  parts.push(`<select id="sort-select" class="filter-select" aria-label="Sort by">${SORT_OPTIONS.map(s =>
    `<option value="${s.id}"${s.id === currentSort ? ' selected' : ''}>${s.label}</option>`
  ).join('')}</select>`);

  // Clear button (only if filters active)
  if (hasActiveFilters()) {
    parts.push('<button id="clear-filters-btn" class="clear-btn">Clear</button>');
  }

  container.innerHTML = parts.join('');
}

function setupFilterListeners(): void {
  // Delegated handler on filter bar for pills and selects
  const filterBar = document.getElementById('filter-bar');
  if (filterBar) {
    // Pill clicks (view + category)
    filterBar.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const pill = target.closest('.pill') as HTMLElement | null;
      if (!pill) {
        // Clear button
        if (target.closest('.clear-btn')) {
          clearAllFilters();
        }
        return;
      }

      const view = pill.getAttribute('data-view') as 'top' | 'all' | null;
      const category = pill.getAttribute('data-category');

      if (view) {
        if (view === currentView) return;
        currentView = view;
      } else if (category !== null) {
        currentCategory = category;
      }

      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    });

    // Select changes (park, priority, season, sort)
    filterBar.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const id = target.id;

      if (id === 'park-select') currentPark = target.value;
      else if (id === 'priority-select') currentPriority = target.value;
      else if (id === 'season-select') currentSeason = target.value;
      else if (id === 'sort-select') { currentSort = target.value; currentPage = 1; updateUrl(); renderTips(); return; }
      else return;

      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
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
      const card = copyBtn.closest('.tip-card');
      const text = card?.querySelector('.tip-text')?.textContent || '';
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
}

function showToast(message = 'Copied to clipboard') {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function filterTips(): Tip[] {
  // Start with view filter
  let tips = currentView === 'top' && topTipIds.size > 0
    ? allTips.filter(tip => topTipIds.has(tip.id))
    : allTips;

  // Precompute lowercase search query once
  const searchLower = searchQuery.toLowerCase();

  // Apply filters
  tips = tips.filter(tip => {
    const matchesCategory = currentCategory === 'all' || tip.category === currentCategory;
    const matchesPriority = currentPriority === 'all' || tip.priority === currentPriority;
    const matchesSeason = currentSeason === 'all' || tip.season === currentSeason || tip.season === 'year-round';
    const matchesPark = currentPark === 'all' || tip.park === currentPark || tip.park === 'all-parks';
    const matchesSearch = !searchQuery ||
      tip.text.toLowerCase().includes(searchLower) ||
      tip.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      (tip.park && PARK_LABELS[tip.park]?.toLowerCase().includes(searchLower));

    return matchesCategory && matchesPriority && matchesSeason && matchesPark && matchesSearch;
  });

  // Apply sorting
  return sortTips(tips);
}

function sortTips(tips: Tip[]): Tip[] {
  const sorted = [...tips];

  switch (currentSort) {
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.source.publishedAt).getTime() - new Date(a.source.publishedAt).getTime()
      );
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.source.publishedAt).getTime() - new Date(b.source.publishedAt).getTime()
      );
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return sorted.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    default:
      return sorted;
  }
}

function highlightText(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatSeason(season: string): string {
  return SEASON_LABELS[season as keyof typeof SEASON_LABELS] || season;
}

// Shared tip card renderer - DRY principle
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
  const filtered = filterTips();
  const totalPages = Math.max(1, Math.ceil(filtered.length / TIPS_PER_PAGE));

  // Clamp current page
  if (currentPage > totalPages) {
    currentPage = totalPages;
    updateUrl();
  }

  const visibleCount = Math.min(filtered.length, currentPage * TIPS_PER_PAGE);
  const visibleTips = filtered.slice(0, visibleCount);

  const resultsEl = document.getElementById('results-count');
  if (resultsEl) {
    resultsEl.textContent = `Showing ${visibleCount} of ${filtered.length} tips`;
  }

  // Render load more button
  renderLoadMore(filtered.length, visibleCount);

  if (filtered.length === 0) {
    const suggestion = hasActiveFilters()
      ? 'Try clearing filters or broadening your search.'
      : 'Try a different search term.';
    container.innerHTML = `<div class="no-results">No tips found. ${suggestion}</div>`;
    return;
  }

  container.innerHTML = visibleTips.map(tip =>
    renderTipCard(tip, { searchQuery })
  ).join('');
}

function showRandomTip(): void {
  if (allTips.length === 0) return;

  const randomIndex = Math.floor(Math.random() * allTips.length);
  const tip = allTips[randomIndex];

  // Reset filters and search
  currentCategory = 'all';
  currentPriority = 'all';
  currentSeason = 'all';
  currentPark = 'all';
  currentPage = 1;
  searchQuery = '';

  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput) searchInput.value = '';

  // Clear URL params
  window.history.replaceState({}, '', window.location.pathname);

  renderFilters();

  // Hide pagination
  const paginationEl = document.getElementById('pagination');
  if (paginationEl) paginationEl.innerHTML = '';

  // Render just this tip with a special highlight
  const container = document.getElementById('tips-container')!;
  const resultsEl = document.getElementById('results-count');
  if (resultsEl) resultsEl.textContent = 'Random tip';
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

  // Debounced search (200ms)
  const searchInput = document.getElementById('search') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchQuery = value;
      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    }, 200);
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
  // Ignore if typing in an input
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  const cards = document.querySelectorAll('.tip-card');
  if (cards.length === 0) return;

  // Find currently focused card
  const focusedCard = document.querySelector('.tip-card:focus') as HTMLElement | null;
  let currentIndex = focusedCard ? Array.from(cards).indexOf(focusedCard) : -1;

  switch (e.key) {
    case 'j': // Next tip
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, cards.length - 1);
      (cards[currentIndex] as HTMLElement).focus();
      (cards[currentIndex] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;

    case 'k': // Previous tip
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      (cards[currentIndex] as HTMLElement).focus();
      (cards[currentIndex] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      break;

    case '/': // Focus search
      e.preventDefault();
      document.getElementById('search')?.focus();
      break;

    case 'Escape': // Clear search focus
      if (document.activeElement === document.getElementById('search')) {
        (document.activeElement as HTMLElement).blur();
      }
      break;

    case 'c': // Copy focused tip
      if (focusedCard) {
        e.preventDefault();
        const text = focusedCard.querySelector('.tip-text')?.textContent || '';
        copyToClipboard(text).then(success => {
          showToast(success ? 'Copied to clipboard' : 'Failed to copy');
        });
      }
      break;

    case 's': // Share focused tip
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

  // Try native share API first (mobile)
  if (navigator.share) {
    navigator.share({
      title: 'Disney Parks Tip',
      text: shareText,
      url: shareUrl,
    }).catch(() => {
      // Fallback to clipboard
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

