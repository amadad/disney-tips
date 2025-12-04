interface Tip {
  id: string;
  text: string;
  category: string;
  park?: string;
  tags: string[];
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

const PARK_LABELS: Record<string, string> = {
  'magic-kingdom': 'Magic Kingdom',
  'epcot': 'EPCOT',
  'hollywood-studios': 'Hollywood Studios',
  'animal-kingdom': 'Animal Kingdom',
  'disney-springs': 'Disney Springs',
  'water-parks': 'Water Parks',
};

let allTips: Tip[] = [];
let currentCategory = 'all';
let searchQuery = '';

async function loadTips(): Promise<void> {
  try {
    const response = await fetch('/tips.json');
    const data: TipsData = await response.json();

    allTips = data.tips;

    document.getElementById('tip-count')!.textContent = `${data.totalTips} tips`;
    document.getElementById('last-updated')!.textContent =
      `Updated ${new Date(data.lastUpdated).toLocaleDateString()}`;

    renderCategoryFilters();
    renderTips();
  } catch (error) {
    document.getElementById('tips-container')!.innerHTML =
      '<div class="no-results">Failed to load tips. Run the pipeline first.</div>';
  }
}

function renderCategoryFilters(): void {
  const container = document.getElementById('category-filters')!;

  container.innerHTML = CATEGORIES.map(cat => `
    <button
      class="filter-btn ${cat.id === currentCategory ? 'active' : ''}"
      data-category="${cat.id}"
    >
      ${cat.label}
    </button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.filter-btn');
    if (!btn) return;

    currentCategory = btn.getAttribute('data-category') || 'all';
    renderCategoryFilters();
    renderTips();
  });
}

function filterTips(): Tip[] {
  return allTips.filter(tip => {
    const matchesCategory = currentCategory === 'all' || tip.category === currentCategory;
    const matchesSearch = !searchQuery ||
      tip.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });
}

function renderTips(): void {
  const container = document.getElementById('tips-container')!;
  const filtered = filterTips();

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No tips found matching your criteria.</div>';
    return;
  }

  container.innerHTML = filtered.map(tip => `
    <div class="tip-card">
      <p class="tip-text">${escapeHtml(tip.text)}</p>
      <div class="tip-meta">
        <span class="tag category-tag ${tip.category}">${tip.category}</span>
        ${tip.park && tip.park !== 'general' ? `<span class="tag park-tag">${PARK_LABELS[tip.park] || tip.park}</span>` : ''}
        ${tip.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
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

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTips();

  const searchInput = document.getElementById('search') as HTMLInputElement;
  searchInput.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    renderTips();
  });
});
