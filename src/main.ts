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

// State
let allTips: Tip[] = [];
let currentCategory = 'all';
let currentPriority = 'all';
let currentSeason = 'all';
let currentPark = 'all';
let searchQuery = '';
let currentPage = 1;
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

// URL parameter helpers
function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

function updateUrl(): void {
  const params = new URLSearchParams();
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
  const countEl = document.getElementById('filtered-count');
  const paginationEl = document.getElementById('pagination');

  if (countEl) countEl.innerHTML = `<a href="${window.location.pathname}" class="back-link">&larr; View all tips</a>`;
  if (paginationEl) paginationEl.innerHTML = '';

  container.innerHTML = renderTipCard(tip, { highlight: true });
}

function hasActiveFilters(): boolean {
  return currentCategory !== 'all' ||
         currentPriority !== 'all' ||
         currentSeason !== 'all' ||
         currentPark !== 'all' ||
         searchQuery !== '';
}

function clearAllFilters(): void {
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

    document.getElementById('tip-count')!.textContent = `${data.totalTips} tips`;
    document.getElementById('last-updated')!.textContent =
      `Updated ${new Date(data.lastUpdated).toLocaleDateString()}`;

    // Calculate next update (cron runs daily at 6 AM UTC)
    const nextUpdateEl = document.getElementById('next-update');
    if (nextUpdateEl) {
      const now = new Date();
      const nextUpdate = new Date(now);
      nextUpdate.setUTCHours(6, 0, 0, 0);
      if (now.getUTCHours() >= 6) {
        nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
      }
      const hoursUntil = Math.round((nextUpdate.getTime() - now.getTime()) / (1000 * 60 * 60));
      nextUpdateEl.textContent = `Next update in ${hoursUntil}h`;
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
  // Category filters (Buttons) with counts
  const categoryContainer = document.getElementById('category-filters')!;
  const counts = getCategoryCounts();
  categoryContainer.innerHTML = CATEGORIES.map(cat => `
    <button
      class="filter-btn ${cat.id === currentCategory ? 'active' : ''}"
      data-category="${cat.id}"
    >
      ${cat.label} <span class="filter-count">${counts[cat.id] || 0}</span>
    </button>
  `).join('');

  // Priority filters (Select)
  const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
  if (prioritySelect) {
    prioritySelect.innerHTML = PRIORITIES.map(p => `
      <option value="${p.id}" ${p.id === currentPriority ? 'selected' : ''}>
        ${p.label}
      </option>
    `).join('');
  }

  // Season filters (Select)
  const seasonSelect = document.getElementById('season-select') as HTMLSelectElement;
  if (seasonSelect) {
    seasonSelect.innerHTML = SEASONS.map(s => `
      <option value="${s.id}" ${s.id === currentSeason ? 'selected' : ''}>
        ${s.label}
      </option>
    `).join('');
  }

  // Park filters (Select)
  const parkSelect = document.getElementById('park-select') as HTMLSelectElement;
  if (parkSelect) {
    parkSelect.innerHTML = PARKS.map(p => `
      <option value="${p.id}" ${p.id === currentPark ? 'selected' : ''}>
        ${p.label}
      </option>
    `).join('');
  }

  // Show/hide clear filters button
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.style.display = hasActiveFilters() ? 'inline-block' : 'none';
  }
}

function setupFilterListeners(): void {
  // Category clicks
  document.getElementById('category-filters')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.filter-btn');
    if (!btn) return;
    currentCategory = btn.getAttribute('data-category') || 'all';
    currentPage = 1;
    updateUrl();
    renderFilters();
    renderTips();
  });

  // Priority change
  const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement;
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      currentPriority = (e.target as HTMLSelectElement).value;
      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    });
  }

  // Season change
  const seasonSelect = document.getElementById('season-select') as HTMLSelectElement;
  if (seasonSelect) {
    seasonSelect.addEventListener('change', (e) => {
      currentSeason = (e.target as HTMLSelectElement).value;
      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    });
  }

  // Park change
  const parkSelect = document.getElementById('park-select') as HTMLSelectElement;
  if (parkSelect) {
    parkSelect.addEventListener('change', (e) => {
      currentPark = (e.target as HTMLSelectElement).value;
      currentPage = 1;
      updateUrl();
      renderFilters();
      renderTips();
    });
  }

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }

  // Pagination clicks (event delegation)
  document.getElementById('pagination')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-page]');
    if (!btn) return;
    const page = btn.getAttribute('data-page');
    if (page === 'prev') {
      currentPage = Math.max(1, currentPage - 1);
    } else if (page === 'next') {
      const filtered = filterTips();
      const totalPages = Math.ceil(filtered.length / TIPS_PER_PAGE);
      currentPage = Math.min(totalPages, currentPage + 1);
    } else {
      currentPage = parseInt(page!, 10);
    }
    updateUrl();
    renderTips();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Copy and Share button delegation with error handling
  document.getElementById('tips-container')!.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // Handle copy button
    const copyBtn = target.closest('.action-btn.copy');
    if (copyBtn) {
      const card = copyBtn.closest('.tip-card');
      const text = card?.querySelector('.tip-text')?.textContent || '';

      const success = await copyToClipboard(text);
      showToast(success ? 'Copied to clipboard' : 'Failed to copy');
      return;
    }

    // Handle share button
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
  // Precompute lowercase search query once
  const searchLower = searchQuery.toLowerCase();

  return allTips.filter(tip => {
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
        ${tip.tags.slice(0, 4).map(tag => `<span class="tag">${query ? highlightText(tag, query) : escapeHtml(tag)}</span>`).join('')}
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

function renderPagination(totalItems: number): void {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  const totalPages = Math.ceil(totalItems / TIPS_PER_PAGE);

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  // Ensure current page is valid
  if (currentPage > totalPages) {
    currentPage = totalPages;
    updateUrl();
  }

  let pages: (number | string)[] = [];

  // Build page numbers with ellipsis
  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (currentPage <= 3) {
      pages = [1, 2, 3, 4, '...', totalPages];
    } else if (currentPage >= totalPages - 2) {
      pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
  }

  paginationEl.innerHTML = `
    <button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    ${pages.map(p =>
      p === '...'
        ? '<span class="page-ellipsis">...</span>'
        : `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>
  `;
}

function renderTips(): void {
  const container = document.getElementById('tips-container')!;
  const filtered = filterTips();
  const totalPages = Math.ceil(filtered.length / TIPS_PER_PAGE);

  // Clamp current page
  if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
  }

  // Paginate
  const startIndex = (currentPage - 1) * TIPS_PER_PAGE;
  const paginatedTips = filtered.slice(startIndex, startIndex + TIPS_PER_PAGE);

  // Update count
  const countEl = document.getElementById('filtered-count');
  if (countEl) {
    if (totalPages > 1) {
      countEl.textContent = `Showing ${startIndex + 1}-${Math.min(startIndex + TIPS_PER_PAGE, filtered.length)} of ${filtered.length} tips`;
    } else {
      countEl.textContent = `Showing ${filtered.length} tips`;
    }
  }

  // Render pagination
  renderPagination(filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No tips found matching your criteria.</div>';
    return;
  }

  container.innerHTML = paginatedTips.map(tip =>
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
  const countEl = document.getElementById('filtered-count');
  if (countEl) countEl.textContent = 'Random tip';

  container.innerHTML = renderTipCard(tip, { highlight: true });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTips();
  setupFilterListeners();

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
