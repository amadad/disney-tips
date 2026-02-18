/**
 * Post-build prerender script.
 * Reads dist/tips.json and injects static tip cards into each category page
 * so search engines can crawl real content instead of "Loading...".
 * 
 * The SPA JS will replace these on hydration — progressive enhancement.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIST = join(import.meta.dirname, '..', 'dist');

interface Tip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
  priority: string;
  season: string;
  source: { videoId: string; channelName: string; publishedAt: string };
}

interface TipsData {
  tips: Tip[];
  topTips?: string[];
  totalTips: number;
  lastUpdated: string;
}

const PARK_LABELS: Record<string, string> = {
  'magic-kingdom': 'Magic Kingdom',
  'epcot': 'EPCOT',
  'hollywood-studios': 'Hollywood Studios',
  'animal-kingdom': 'Animal Kingdom',
  'disney-springs': 'Disney Springs',
  'water-parks': 'Water Parks',
  'disneyland': 'Disneyland',
  'california-adventure': 'California Adventure',
  'all-parks': '',
};

const PRIORITY_ICONS: Record<string, string> = {
  high: '🔥',
  medium: '💡',
  low: '📌',
};

const SEASON_LABELS: Record<string, string> = {
  'year-round': 'Year Round',
  'christmas': 'Christmas',
  'halloween': 'Halloween',
  'flower-garden': 'Flower & Garden',
  'food-wine': 'Food & Wine',
  'festival-arts': 'Festival of Arts',
  'summer': 'Summer',
};

// Pages and their category filters
const PAGES: Record<string, string | null> = {
  'index.html': null,         // all tips (top tips)
  'parks.html': 'parks',
  'dining.html': 'dining',
  'hotels.html': 'hotels',
  'budget.html': 'budget',
  'planning.html': 'planning',
  'transportation.html': 'transportation',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTipCard(tip: Tip): string {
  const parkLabel = tip.park && tip.park !== 'all-parks' ? PARK_LABELS[tip.park] || tip.park : '';
  const seasonLabel = tip.season !== 'year-round' ? SEASON_LABELS[tip.season] || tip.season : '';
  
  return `<article class="tip-card priority-${tip.priority}" data-id="${tip.id}">
  <div class="tip-header">
    <span class="priority-badge ${tip.priority}">${PRIORITY_ICONS[tip.priority] || ''} ${tip.priority}</span>
    ${seasonLabel ? `<span class="season-badge">${escapeHtml(seasonLabel)}</span>` : ''}
  </div>
  <p class="tip-text">${escapeHtml(tip.text)}</p>
  <div class="tip-meta">
    <span class="tag category-tag ${tip.category}">${tip.category}</span>
    ${parkLabel ? `<span class="tag park-tag">${escapeHtml(parkLabel)}</span>` : ''}
    ${tip.tags.slice(0, 2).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
  </div>
  <div class="tip-source">From <a href="https://youtube.com/watch?v=${tip.source.videoId}" target="_blank" rel="noopener noreferrer">${escapeHtml(tip.source.channelName)}</a> &middot; ${new Date(tip.source.publishedAt).toLocaleDateString()}</div>
</article>`;
}

function main() {
  const data: TipsData = JSON.parse(readFileSync(join(DIST, 'tips.json'), 'utf-8'));
  const topIds = new Set(data.topTips || []);
  
  console.log(`Prerendering ${data.tips.length} tips into dist pages...`);

  for (const [page, category] of Object.entries(PAGES)) {
    const filePath = join(DIST, page);
    let html: string;
    try {
      html = readFileSync(filePath, 'utf-8');
    } catch {
      console.warn(`  Skipping ${page} (not found)`);
      continue;
    }

    // Select tips for this page
    let tips: Tip[];
    if (category) {
      tips = data.tips.filter(t => t.category === category);
    } else {
      // index.html: show top tips
      tips = topIds.size > 0
        ? data.tips.filter(t => topIds.has(t.id))
        : data.tips;
    }

    // Sort by newest, take first 50
    tips.sort((a, b) => new Date(b.source.publishedAt).getTime() - new Date(a.source.publishedAt).getTime());
    const displayTips = tips.slice(0, 50);

    // Build static HTML block
    const staticBlock = `<noscript><style>.skeleton-card{display:none}</style></noscript>
<div id="prerendered-tips" class="tips-grid" aria-label="${category ? category + ' tips' : 'Top Disney tips'}">
${displayTips.map(renderTipCard).join('\n')}
</div>`;

    // Replace the tip count "Loading..." with actual count
    html = html.replace(
      /<span id="tip-count">Loading\.\.\.<\/span>/,
      `<span id="tip-count">${data.totalTips} tips</span>`
    );

    // Inject after the skeleton cards div (tips-container)
    // We insert right after the tips-container div's skeleton cards
    const skeletonMarker = '</div>\n\n    <div id="pagination"';
    if (html.includes(skeletonMarker)) {
      html = html.replace(
        skeletonMarker,
        `</div>\n\n    ${staticBlock}\n\n    <div id="pagination"`
      );
    } else {
      // Fallback: inject before pagination
      const paginationMarker = '<div id="pagination"';
      if (html.includes(paginationMarker)) {
        html = html.replace(
          paginationMarker,
          `${staticBlock}\n\n    ${paginationMarker}`
        );
      } else {
        console.warn(`  Could not find injection point in ${page}`);
        continue;
      }
    }

    writeFileSync(filePath, html);
    console.log(`  ✓ ${page}: ${displayTips.length} tips injected`);
  }

  console.log('Prerendering complete.');
}

main();
