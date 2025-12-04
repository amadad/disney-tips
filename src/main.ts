interface Tip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
  season: string;
  source: {
    videoId: string;
    channelName: string;
    videoTitle: string;
    publishedAt: string;
  };
}

interface TipsData {
  lastUpdated: string;
  totalTips: number;
  tips: Tip[];
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'parks', label: 'Parks' },
  { id: 'dining', label: 'Dining' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'genie', label: 'Genie+' },
  { id: 'budget', label: 'Budget' },
  { id: 'planning', label: 'Planning' },
  { id: 'transportation', label: 'Transport' },
];

const PRIORITIES = [
  { id: 'all', label: 'All Tips' },
  { id: 'high', label: 'High Impact' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Nice to Know' },
];

const SEASONS = [
  { id: 'all', label: 'Any Time' },
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

let allTips: Tip[] = [];
let currentCategory = 'all';
let currentPriority = 'all';
let currentSeason = 'all';
let searchQuery = '';

async function loadTips(): Promise<void> {
  try {
    const response = await fetch(import.meta.env.BASE_URL + 'tips.json');
    const data: TipsData = await response.json();

    allTips = data.tips;

    document.getElementById('tip-count')!.textContent = `${data.totalTips} tips`;
    document.getElementById('last-updated')!.textContent =
      `Updated ${new Date(data.lastUpdated).toLocaleDateString()}`;

    renderFilters();
    renderTips();
  } catch (error) {
    document.getElementById('tips-container')!.innerHTML =
      '<div class="no-results">Failed to load tips. Run the pipeline first.</div>';
  }
}

function renderFilters(): void {
  // Category filters
  const categoryContainer = document.getElementById('category-filters')!;
  categoryContainer.innerHTML = CATEGORIES.map(cat => `
    <button
      class="filter-btn ${cat.id === currentCategory ? 'active' : ''}"
      data-category="${cat.id}"
    >
      ${cat.label}
    </button>
  `).join('');

  // Priority filters
  const priorityContainer = document.getElementById('priority-filters')!;
  if (priorityContainer) {
    priorityContainer.innerHTML = PRIORITIES.map(p => `
      <button
        class="filter-btn priority-btn ${p.id === currentPriority ? 'active' : ''}"
        data-priority="${p.id}"
      >
        ${p.id !== 'all' ? PRIORITY_ICONS[p.id] + ' ' : ''}${p.label}
      </button>
    `).join('');
  }

  // Season filters
  const seasonContainer = document.getElementById('season-filters')!;
  if (seasonContainer) {
    seasonContainer.innerHTML = SEASONS.map(s => `
      <button
        class="filter-btn season-btn ${s.id === currentSeason ? 'active' : ''}"
        data-season="${s.id}"
      >
        ${s.label}
      </button>
    `).join('');
  }
}

function setupFilterListeners(): void {
  // Category clicks
  document.getElementById('category-filters')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.filter-btn');
    if (!btn) return;
    currentCategory = btn.getAttribute('data-category') || 'all';
    renderFilters();
    renderTips();
  });

  // Priority clicks
  const priorityContainer = document.getElementById('priority-filters');
  if (priorityContainer) {
    priorityContainer.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.filter-btn');
      if (!btn) return;
      currentPriority = btn.getAttribute('data-priority') || 'all';
      renderFilters();
      renderTips();
    });
  }

  // Season clicks
  const seasonContainer = document.getElementById('season-filters');
  if (seasonContainer) {
    seasonContainer.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.filter-btn');
      if (!btn) return;
      currentSeason = btn.getAttribute('data-season') || 'all';
      renderFilters();
      renderTips();
    });
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

function renderTips(): void {
  const container = document.getElementById('tips-container')!;
  const filtered = filterTips();

  // Update count
  const countEl = document.getElementById('filtered-count');
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} tips`;
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No tips found matching your criteria.</div>';
    return;
  }

  container.innerHTML = filtered.map(tip => `
    <div class="tip-card priority-${tip.priority}">
      <div class="tip-header">
        <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
        ${tip.season !== 'year-round' ? `<span class="season-badge">${formatSeason(tip.season)}</span>` : ''}
      </div>
      <p class="tip-text">${escapeHtml(tip.text)}</p>
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
  `).join('');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTips();
  setupFilterListeners();

  const searchInput = document.getElementById('search') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    renderTips();
  });
});
