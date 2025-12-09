import type { Tip, TipsData } from './types';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'parks', label: 'Parks' },
  { id: 'dining', label: 'Dining' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'lightning-lane', label: 'Lightning Lane' },
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

const PARK_LABELS: Record<string, string> = {
  'magic-kingdom': 'Magic Kingdom',
  'epcot': 'EPCOT',
  'hollywood-studios': 'Hollywood Studios',
  'animal-kingdom': 'Animal Kingdom',
  'disney-springs': 'Disney Springs',
  'water-parks': 'Water Parks',
  'disneyland': 'Disneyland',
  'california-adventure': 'California Adventure',
  'all-parks': 'All Parks',
};

const PRIORITY_ICONS: Record<string, string> = {
  'high': '🔥',
  'medium': '⭐',
  'low': '💡',
};

const TIPS_PER_PAGE = 50;

let allTips: Tip[] = [];
let currentCategory = 'all';
let currentPriority = 'all';
let currentSeason = 'all';
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
  if (searchQuery) params.set('q', searchQuery);
  if (currentPage > 1) params.set('page', String(currentPage));

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

function loadFromUrl(): void {
  const params = getUrlParams();
  currentCategory = params.get('category') || 'all';
  currentPriority = params.get('priority') || 'all';
  currentSeason = params.get('season') || 'all';
  searchQuery = params.get('q') || '';
  currentPage = parseInt(params.get('page') || '1', 10);

  // Update search input if there's a query
  const searchInput = document.getElementById('search') as HTMLInputElement;
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }
}

async function loadTips(): Promise<void> {
  // Simulate network delay to show off skeleton loader (optional, remove in prod)
  // await new Promise(resolve => setTimeout(resolve, 1000));

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

    loadFromUrl();
    renderFilters();
    renderTips();
  } catch (error) {
    document.getElementById('tips-container')!.innerHTML =
      '<div class="no-results">Failed to load tips. Run the pipeline first.</div>';
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
      renderTips();
    });
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

  // Copy button delegation
  document.getElementById('tips-container')!.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('.action-btn.copy');
    if (!btn) return;

    const card = btn.closest('.tip-card');
    const text = card?.querySelector('.tip-text')?.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      showToast();
    });
  });
}

function showToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function filterTips(): Tip[] {
  return allTips.filter(tip => {
    const matchesCategory = currentCategory === 'all' || tip.category === currentCategory;
    const matchesPriority = currentPriority === 'all' || tip.priority === currentPriority;
    const matchesSeason = currentSeason === 'all' || tip.season === currentSeason || tip.season === 'year-round';
    const matchesSearch = !searchQuery ||
      tip.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tip.park && PARK_LABELS[tip.park]?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesPriority && matchesSeason && matchesSearch;
  });
}

function highlightText(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
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
    <button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
    ${pages.map(p =>
      p === '...'
        ? '<span class="page-ellipsis">...</span>'
        : `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}>
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
    container.innerHTML = '<div class="no-results">No secrets found matching your criteria.</div>';
    return;
  }

  container.innerHTML = paginatedTips.map(tip => {
    const highlightedText = highlightText(tip.text, searchQuery);

    return `
    <div class="tip-card priority-${tip.priority}" data-id="${tip.id}">
      <button class="action-btn copy" title="Copy to clipboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <div class="tip-header">
        <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
        ${tip.season !== 'year-round' ? `<span class="season-badge">${formatSeason(tip.season)}</span>` : ''}
      </div>
      <p class="tip-text">${highlightedText}</p>
      <div class="tip-meta">
        <span class="tag category-tag ${tip.category}">${tip.category}</span>
        ${tip.park && tip.park !== 'all-parks' ? `<span class="tag park-tag">${PARK_LABELS[tip.park] || tip.park}</span>` : ''}
        ${tip.tags.slice(0, 4).map(tag => `<span class="tag">${highlightText(tag, searchQuery)}</span>`).join('')}
      </div>
      <div class="tip-source">
        From <a href="https://youtube.com/watch?v=${tip.source.videoId}" target="_blank" rel="noopener">
          ${escapeHtml(tip.source.channelName)}
        </a>
        &middot; ${new Date(tip.source.publishedAt).toLocaleDateString()}
      </div>
    </div>
  `}).join('');
}

function formatSeason(season: string): string {
  const labels: Record<string, string> = {
    'christmas': '🎄 Christmas',
    'halloween': '🎃 Halloween',
    'flower-garden': '🌸 Flower & Garden',
    'food-wine': '🍷 Food & Wine',
    'festival-arts': '🎨 Festival of Arts',
    'summer': '☀️ Summer',
    'year-round': '📅 Year Round',
  };
  return labels[season] || season;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showRandomTip(): void {
  if (allTips.length === 0) return;

  const randomIndex = Math.floor(Math.random() * allTips.length);
  const tip = allTips[randomIndex];

  // Reset filters and search
  currentCategory = 'all';
  currentPriority = 'all';
  currentSeason = 'all';
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

  const highlightedText = escapeHtml(tip.text);
  container.innerHTML = `
    <div class="tip-card priority-${tip.priority} random-highlight" data-id="${tip.id}">
      <button class="action-btn copy" title="Copy to clipboard">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
      <div class="tip-header">
        <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
        ${tip.season !== 'year-round' ? `<span class="season-badge">${formatSeason(tip.season)}</span>` : ''}
      </div>
      <p class="tip-text">${highlightedText}</p>
      <div class="tip-meta">
        <span class="tag category-tag ${tip.category}">${tip.category}</span>
        ${tip.park && tip.park !== 'all-parks' ? `<span class="tag park-tag">${PARK_LABELS[tip.park] || tip.park}</span>` : ''}
        ${tip.tags.slice(0, 4).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      <div class="tip-source">
        From <a href="https://youtube.com/watch?v=${tip.source.videoId}" target="_blank" rel="noopener">
          ${escapeHtml(tip.source.channelName)}
        </a>
        &middot; ${new Date(tip.source.publishedAt).toLocaleDateString()}
      </div>
    </div>
  `;
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
      renderTips();
    }, 200);
  });

  // Random tip button
  const randomBtn = document.getElementById('random-tip-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', showRandomTip);
  }
});
