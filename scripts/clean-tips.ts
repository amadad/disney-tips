import { readFileSync, writeFileSync } from 'fs';
import { CATEGORY_LABELS, PARK_LABELS, type ExtractedTip, type TipsData } from './types.js';
import { isDisneyRelevantVideoTitle, isHighQualityTipText, normalizeTipTags } from '../shared/tipQuality.js';

const TIPS_PATH = 'data/public/tips.json';
const FEED_PATH = 'data/public/feed.xml';
const HEALTH_PATH = 'data/public/health.json';
const SITEMAP_PATH = 'data/public/sitemap.xml';
const TOP_TIP_COUNT = 100;
const RSS_TIP_COUNT = 50;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatRfc822Date(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return new Date(0).toUTCString();
  return parsed.toUTCString();
}

function cleanTip(tip: ExtractedTip): ExtractedTip | null {
  if (!isHighQualityTipText(tip.text)) return null;
  if (!isDisneyRelevantVideoTitle(tip.source.videoTitle)) return null;
  return {
    ...tip,
    tags: normalizeTipTags(tip.tags),
  };
}

function buildTopTips(previousTopTips: string[] | undefined, tips: ExtractedTip[]): string[] | undefined {
  if (!previousTopTips) return undefined;

  const tipIds = new Set(tips.map(tip => tip.id));
  const topTips: string[] = [];
  const topTipSet = new Set<string>();

  for (const id of previousTopTips) {
    if (!tipIds.has(id) || topTipSet.has(id)) continue;
    topTips.push(id);
    topTipSet.add(id);
  }

  for (const tip of tips) {
    if (topTips.length >= TOP_TIP_COUNT) break;
    if (topTipSet.has(tip.id)) continue;
    topTips.push(tip.id);
    topTipSet.add(tip.id);
  }

  return topTips;
}

function writeFeed(tips: ExtractedTip[], lastUpdated: string): void {
  const siteUrl = process.env.SITE_URL || 'https://disney.bound.tips';
  const items = tips.slice(0, RSS_TIP_COUNT).map((tip) => {
    const title = tip.text.length > 100 ? `${tip.text.slice(0, 97)}...` : tip.text;
    const priorityLabel = `${tip.priority.slice(0, 1).toUpperCase()}${tip.priority.slice(1)}`;
    const categories = [
      CATEGORY_LABELS[tip.category],
      PARK_LABELS[tip.park],
      priorityLabel,
    ].map(category => `      <category>${escapeXml(category)}</category>`).join('\n');

    return [
      '    <item>',
      `      <title>${escapeXml(title)}</title>`,
      `      <link>https://www.youtube.com/watch?v=${escapeXml(tip.source.videoId)}</link>`,
      `      <description>${escapeXml(`${tip.text} (Source: ${tip.source.channelName})`)}</description>`,
      `      <pubDate>${escapeXml(formatRfc822Date(tip.source.publishedAt))}</pubDate>`,
      `      <guid isPermaLink="false">${escapeXml(tip.id)}</guid>`,
      categories,
      '    </item>',
    ].join('\n');
  });

  const channel = [
    '  <channel>',
    '    <title>Disney Tips - bound.tips</title>',
    `    <link>${escapeXml(siteUrl)}</link>`,
    '    <description>Daily Disney tips extracted from top YouTube channels</description>',
    `    <lastBuildDate>${escapeXml(formatRfc822Date(lastUpdated))}</lastBuildDate>`,
    '    <language>en-us</language>',
    '    <ttl>1440</ttl>',
    '    <image>',
    `      <url>${escapeXml(`${siteUrl}/og-image.png`)}</url>`,
    '      <title>Disney Tips - bound.tips</title>',
    `      <link>${escapeXml(siteUrl)}</link>`,
    '    </image>',
    items.join('\n'),
    '  </channel>',
  ].join('\n');

  writeFileSync(FEED_PATH, `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n${channel}\n</rss>\n`);
}

function writeHealth(totalTips: number, lastUpdated: string): void {
  writeFileSync(HEALTH_PATH, JSON.stringify({
    status: 'ok',
    lastUpdated,
    totalTips,
  }, null, 2));
}

function writeSitemap(lastUpdated: string): void {
  const siteUrl = process.env.SITE_URL || 'https://disney.bound.tips';
  const lastmod = lastUpdated.split('T')[0];
  const pages = [
    '',
    '/plan.html',
    '/tips.html',
    '/about.html',
    '/parks.html',
    '/dining.html',
    '/hotels.html',
    '/budget.html',
    '/planning.html',
    '/transportation.html',
  ];
  const entries = pages
    .map(path => `  <url>\n    <loc>${escapeXml(`${siteUrl}${path}`)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`)
    .join('\n');

  writeFileSync(
    SITEMAP_PATH,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
  );
}

function main(): void {
  const data: TipsData = JSON.parse(readFileSync(TIPS_PATH, 'utf-8'));
  const tips = data.tips
    .map(cleanTip)
    .filter((tip): tip is ExtractedTip => tip !== null);

  const removed = data.tips.length - tips.length;
  const nowIso = new Date().toISOString();
  const lastUpdated = removed > 0 ? nowIso : data.lastUpdated;
  const topTips = buildTopTips(data.topTips, tips);

  const output: TipsData = {
    ...data,
    lastUpdated,
    lastChecked: nowIso,
    totalTips: tips.length,
    tips,
    ...(topTips ? { topTips } : {}),
  };

  writeFileSync(TIPS_PATH, JSON.stringify(output, null, 2));
  writeFeed(tips, lastUpdated);
  writeHealth(tips.length, lastUpdated);
  writeSitemap(lastUpdated);

  console.log(`Cleaned tips: ${tips.length} kept, ${removed} removed`);
  if (topTips) console.log(`Top tips: ${topTips.length}`);
}

main();
