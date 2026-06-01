import express from 'express';
import { appendFile, mkdir, readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked';
import {
  createEmbeddingClient,
  EMBEDDING_DIMENSIONS,
  embedTexts,
  isCurrentEmbeddingsMetadata,
  type EmbeddingEntry,
} from '../shared/embeddings.js';
import {
  buildPlanningRequestResponse,
  formatPlanningRequestEmail,
  parsePlanningRequest,
  type StoredPlanningRequest,
} from '../shared/planningRequest.js';
import {
  filterTipsByCategoryPark,
  normalizeSearchFilter,
  normalizeSearchLimit,
  textSearchTipIds,
  type TipSearchFilters,
} from '../shared/tipSearch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PRIVATE_DATA_DIR = join(__dirname, '..', 'data', 'private');
const PLANNING_REQUESTS_PATH = join(PRIVATE_DATA_DIR, 'planning-requests.jsonl');
const PUBLIC_DATA_DIR = join(__dirname, '..', 'data', 'public');

let embeddingClient = createEmbeddingClient(process.env.GEMINI_API_KEY);
if (embeddingClient) {
  console.log('Gemini embeddings initialized for semantic search');
} else {
  console.warn('Warning: GEMINI_API_KEY not set. Falling back to text search.');
}

// Load tips data
interface Tip {
  id: string;
  text: string;
  category: string;
  park: string;
  tags: string[];
  priority: string;
  season: string;
  source: {
    videoId: string;
    channelName: string;
    videoTitle: string;
    publishedAt: string;
  };
}

interface TipsData {
  tips: Tip[];
  topTips?: string[];
}

let tipsData: TipsData = { tips: [] };
let embeddingsMap: Map<string, number[]> = new Map();

async function loadTips() {
  try {
    const tipsPath = join(PUBLIC_DATA_DIR, 'tips.json');
    const raw = await readFile(tipsPath, 'utf-8');
    tipsData = JSON.parse(raw);
    console.log(`Loaded ${tipsData.tips.length} tips`);
  } catch (err) {
    console.error('Failed to load tips:', err);
  }
}

async function loadEmbeddings() {
  try {
    embeddingsMap = new Map();

    const embPath = join(PUBLIC_DATA_DIR, 'embeddings.json');
    const metaPath = join(PUBLIC_DATA_DIR, 'embeddings.meta.json');
    if (!existsSync(embPath)) {
      console.warn('No embeddings.json found, using text search only');
      return;
    }
    if (!existsSync(metaPath)) {
      console.warn('No embeddings metadata found, using text search only');
      return;
    }

    const metadata = JSON.parse(await readFile(metaPath, 'utf-8'));
    if (!isCurrentEmbeddingsMetadata(metadata)) {
      console.warn('Embeddings metadata does not match current model, using text search only');
      return;
    }

    const raw = await readFile(embPath, 'utf-8');
    const entries: EmbeddingEntry[] = JSON.parse(raw);
    const dimMatch = entries.every(entry => entry.vector.length === EMBEDDING_DIMENSIONS);
    if (!dimMatch) {
      console.warn('Embeddings.json dimension mismatch, using text search only');
      return;
    }

    embeddingsMap = new Map(entries.map(entry => [entry.tipId, entry.vector]));
    console.log(`Loaded ${embeddingsMap.size} embeddings`);
  } catch (err) {
    console.error('Failed to load embeddings:', err);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// LRU cache for query embeddings
const queryEmbedCache = new Map<string, number[]>();
const CACHE_MAX = 1000;

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function getQueryEmbedding(query: string): Promise<number[] | null> {
  if (!embeddingClient) return null;

  const key = normalizeQuery(query);
  if (queryEmbedCache.has(key)) {
    const vec = queryEmbedCache.get(key)!;
    queryEmbedCache.delete(key);
    queryEmbedCache.set(key, vec);
    return vec;
  }

  const [vec] = await embedTexts(embeddingClient, [key], 'RETRIEVAL_QUERY');

  if (queryEmbedCache.size >= CACHE_MAX) {
    const oldest = queryEmbedCache.keys().next().value;
    if (oldest !== undefined) queryEmbedCache.delete(oldest);
  }
  queryEmbedCache.set(key, vec);
  return vec;
}

async function semanticSearch(query: string, filters: TipSearchFilters, limit: number): Promise<string[] | null> {
  if (!embeddingClient || embeddingsMap.size === 0) return null;

  try {
    const queryVec = await getQueryEmbedding(query);
    if (!queryVec) return null;

    const scored: { id: string; score: number }[] = [];
    for (const tip of filterTipsByCategoryPark(tipsData.tips, filters)) {
      const vec = embeddingsMap.get(tip.id);
      if (vec) {
        scored.push({ id: tip.id, score: cosineSimilarity(queryVec, vec) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(score => score.id);
  } catch (err) {
    console.error('Semantic search failed, falling back to text:', err);
    return null;
  }
}

// Endpoint-specific rate limiters keep search activity from blocking paid-plan intake.
function createRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, number[]>();

  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of buckets) {
      const recent = timestamps.filter(t => now - t < windowMs);
      if (recent.length === 0) buckets.delete(ip);
      else buckets.set(ip, recent);
    }
  }, Math.min(windowMs, 300000));

  return (ip: string): boolean => {
    const now = Date.now();
    const timestamps = buckets.get(ip) || [];
    const recent = timestamps.filter(t => now - t < windowMs);
    if (recent.length >= maxRequests) return true;
    recent.push(now);
    buckets.set(ip, recent);
    return false;
  };
}

const isSearchRateLimited = createRateLimiter(60, 60000);
const isEmbedQueryRateLimited = createRateLimiter(30, 60000);
const isSubscribeRateLimited = createRateLimiter(5, 60000);
const isPlanningRequestRateLimited = createRateLimiter(3, 15 * 60 * 1000);

// Text-based search fallback
function textSearch(query: string, filters: TipSearchFilters, limit: number): string[] {
  const ids = textSearchTipIds(tipsData.tips, query, filters, limit);
  if (ids.length > 0) return ids;
  if (filters.category || filters.park) {
    return filterTipsByCategoryPark(tipsData.tips, filters).slice(0, limit).map(tip => tip.id);
  }
  return tipsData.topTips?.slice(0, limit) || [];
}

const app = express();

// Trust proxy for correct client IPs behind Traefik
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'dist')));
app.use('/data/public', (req, res, next) => {
  if (req.path === '/embeddings.json' || req.path === '/embeddings.meta.json') {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}, express.static(PUBLIC_DATA_DIR, { maxAge: '1h' }));

function getClientIp(req: express.Request): string {
  const cloudflareIp = req.get('cf-connecting-ip')?.trim();
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = req.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedFor) return forwardedFor;

  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Search API endpoint
app.post('/api/search', async (req, res) => {
  const ip = getClientIp(req);
  if (isSearchRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many searches. Please try again in a minute.' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const trimmedQuery = query.trim();
  const filters: TipSearchFilters = {
    category: normalizeSearchFilter(req.body.category ?? req.query.category),
    park: normalizeSearchFilter(req.body.park ?? req.query.park),
  };
  const limit = normalizeSearchLimit(req.body.limit ?? req.query.limit);
  console.log(`Search: "${trimmedQuery}"`);

  // Try semantic search first, fall back to text
  const ids = await semanticSearch(trimmedQuery, filters, limit) || textSearch(trimmedQuery, filters, limit);

  // If ?enrich=true, return full tip objects with scores
  if (req.query.enrich === 'true') {
    const tipMap = new Map(tipsData.tips.map(t => [t.id, t]));
    const results = ids.map((id, i) => {
      const tip = tipMap.get(id);
      return tip ? { ...tip, score: 1 - i / ids.length } : null;
    }).filter(Boolean);
    return res.json({ results });
  }

  res.json({ ids });
});

// Legacy query-vector endpoint; the main UI now uses /api/search to avoid shipping embeddings to browsers.
app.post('/api/embed-query', async (req, res) => {
  const ip = getClientIp(req);
  if (isEmbedQueryRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const vector = await getQueryEmbedding(query.trim());
    if (!vector) {
      return res.status(503).json({ error: 'Embedding service unavailable' });
    }
    res.json({ vector });
  } catch (err) {
    console.error('Embed query failed:', err);
    res.status(500).json({ error: 'Embedding failed' });
  }
});

// Email subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  const ip = getClientIp(req);
  if (isSubscribeRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        unsubscribed: false,
        audience_id: process.env.RESEND_AUDIENCE_ID || '',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', err);
      return res.status(response.status).json({ error: 'Failed to subscribe' });
    }

    console.log(`Subscribed: ${email}`);
    res.json({ ok: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

async function savePlanningRequest(record: StoredPlanningRequest): Promise<void> {
  await mkdir(PRIVATE_DATA_DIR, { recursive: true });
  await appendFile(PLANNING_REQUESTS_PATH, `${JSON.stringify(record)}\n`, 'utf-8');
}

async function notifyPlanningRequest(record: StoredPlanningRequest): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const recipient = process.env.PLAN_REQUEST_RECIPIENT;
  if (!resendKey || !recipient) return;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Disney Plans <plans@disney.bound.tips>',
        to: [recipient],
        subject: `Disney plan request: ${record.request.dates}`,
        text: formatPlanningRequestEmail(record),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Planning request email failed:', err);
    }
  } catch (error) {
    console.error('Planning request email failed:', error);
  }
}

app.post('/api/planning-request', async (req, res) => {
  const ip = getClientIp(req);
  if (isPlanningRequestRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const parsed = parsePlanningRequest(req.body);
  if (!parsed.ok) {
    return res.status(parsed.status).json({ error: parsed.error });
  }

  const record: StoredPlanningRequest = {
    id: `plan_${randomUUID()}`,
    createdAt: new Date().toISOString(),
    ip,
    userAgent: req.get('user-agent') || '',
    request: parsed.value,
  };

  try {
    await savePlanningRequest(record);
    void notifyPlanningRequest(record);
    console.log(`Planning request ${record.id}: ${record.request.email}`);
    res.status(202).json(buildPlanningRequestResponse(record.id, process.env.PLAN_PAYMENT_URL));
  } catch (error) {
    console.error('Planning request save failed:', error);
    res.status(500).json({ error: 'Failed to save planning request.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    tips: tipsData.tips.length,
    topTips: tipsData.topTips?.length || 0,
    embeddingsLoaded: embeddingsMap.size,
    semanticSearch: embeddingClient !== null && embeddingsMap.size > 0,
  });
});

// Wiki viewer — renders the LLM Wiki under wiki/ as HTML so the operator
// can review pages in a browser while Claude Code writes them.
const WIKI_DIR = join(__dirname, '..', 'wiki');

function wikiShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #222; }
  a { color: #0066cc; } a:hover { text-decoration: underline; }
  h1, h2, h3 { line-height: 1.2; }
  h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
  h2 { border-bottom: 1px solid #eee; padding-bottom: 0.2em; margin-top: 2em; }
  code { background: #f4f4f4; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 4px solid #ddd; color: #555; padding-left: 1em; margin-left: 0; }
  nav { font-size: 0.9em; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 1px solid #eee; }
  nav a { margin-right: 1em; }
  ul { padding-left: 1.5em; }
  .muted { color: #666; }
</style>
</head>
<body>
<nav>
  <a href="/wiki">Wiki home</a>
  <a href="/wiki/files">Browse files</a>
  <a href="/wiki/log.md">Log</a>
</nav>
${body}
</body>
</html>`;
}

async function listWikiFiles(dir: string, rel = ''): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await listWikiFiles(join(dir, entry.name), entryRel)));
    } else if (entry.name.endsWith('.md')) {
      out.push(entryRel);
    }
  }
  return out;
}

app.get('/wiki', async (_req, res) => {
  try {
    if (!existsSync(WIKI_DIR)) {
      return res.send(wikiShell('Wiki', '<h1>Wiki</h1><p>No wiki directory yet.</p>'));
    }
    const indexPath = join(WIKI_DIR, 'index.md');
    if (existsSync(indexPath)) {
      return res.redirect('/wiki/index.md');
    }
    return res.redirect('/wiki/files');
  } catch (err) {
    console.error('Wiki home failed:', err);
    res.status(500).send(wikiShell('Wiki', '<h1>Wiki</h1><p>Failed to open wiki.</p>'));
  }
});

app.get('/wiki/files', async (_req, res) => {
  try {
    if (!existsSync(WIKI_DIR)) {
      return res.send(wikiShell('Wiki files', '<h1>Wiki files</h1><p>No wiki directory yet.</p>'));
    }
    const files = (await listWikiFiles(WIKI_DIR)).sort();
    const contentFiles = files.filter((f) => f !== 'index.md' && f !== 'log.md' && f !== 'CLAUDE.md' && !f.startsWith('sources/'));
    const sourceNotes = files.filter((f) => f.startsWith('sources/'));
    const metaFiles = files.filter((f) => f === 'index.md' || f === 'log.md' || f === 'CLAUDE.md');

    const renderList = (items: string[]) => items.map((f) => `<li><a href="/wiki/${f}">${f}</a></li>`).join('\n');

    const body = [
      '<h1>Wiki files</h1>',
      '<p class="muted">Primary reading flow: start at <a href="/wiki/index.md">index.md</a>, then drill into content pages. Source summaries are background ingest notes, not the main trip-planning pages.</p>',
      `<h2>Content pages (${contentFiles.length})</h2>`,
      `<ul>${renderList(contentFiles)}</ul>`,
      `<h2>Source summaries / ingest notes (${sourceNotes.length})</h2>`,
      `<ul>${renderList(sourceNotes)}</ul>`,
      `<h2>Meta (${metaFiles.length})</h2>`,
      `<ul>${renderList(metaFiles)}</ul>`,
    ].join('\n');

    res.send(wikiShell('Wiki files', body));
  } catch (err) {
    console.error('Wiki file list failed:', err);
    res.status(500).send(wikiShell('Wiki files', '<h1>Wiki files</h1><p>Failed to list files.</p>'));
  }
});

app.get('/wiki/*', async (req, res) => {
  const reqPath = (req.params as unknown as { 0?: string })[0] || '';
  // Security: resolve and verify the path stays inside WIKI_DIR
  const resolved = join(WIKI_DIR, reqPath);
  if (!resolved.startsWith(WIKI_DIR + '/') && resolved !== WIKI_DIR) {
    return res.status(400).send(wikiShell('Forbidden', '<h1>Forbidden</h1>'));
  }
  if (!existsSync(resolved)) {
    return res.status(404).send(wikiShell('Not found', `<h1>Not found</h1><p><code>${reqPath}</code> does not exist.</p>`));
  }
  try {
    const md = await readFile(resolved, 'utf-8');
    const html = marked.parse(md) as string;
    const title = reqPath.split('/').pop() || 'Wiki';
    res.send(wikiShell(title, html));
  } catch (err) {
    console.error('Wiki render failed:', err);
    res.status(500).send(wikiShell('Error', '<h1>Error</h1>'));
  }
});

app.get('/plan', (_req, res) => res.sendFile(join(__dirname, '..', 'dist', 'plan.html')));
app.get('/tips', (_req, res) => res.sendFile(join(__dirname, '..', 'dist', 'tips.html')));

// Static fallback - only known page routes
const PAGE_FILES: Record<string, string> = {
  '/': 'index.html',
  '/about.html': 'about.html',
  '/parks.html': 'parks.html',
  '/dining.html': 'dining.html',
  '/hotels.html': 'hotels.html',
  '/budget.html': 'budget.html',
  '/planning.html': 'planning.html',
  '/transportation.html': 'transportation.html',
  '/plan.html': 'plan.html',
  '/tips.html': 'tips.html',
};

for (const [page, file] of Object.entries(PAGE_FILES)) {
  app.get(page, (_req, res) => res.sendFile(join(__dirname, '..', 'dist', file)));
}

// Start server after loading data
async function start() {
  await loadTips();
  await loadEmbeddings();
  setInterval(async () => { await loadTips(); await loadEmbeddings(); }, 60 * 60 * 1000);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
