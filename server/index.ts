import express from 'express';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenAI client for semantic search
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('OpenAI initialized for semantic search');
} else {
  console.warn('Warning: OPENAI_API_KEY not set. Falling back to text search.');
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

interface EmbeddingEntry {
  tipId: string;
  vector: number[];
}

let tipsData: TipsData = { tips: [] };
let embeddingsMap: Map<string, number[]> = new Map();

async function loadTips() {
  try {
    const tipsPath = join(__dirname, '..', 'data', 'public', 'tips.json');
    const raw = await readFile(tipsPath, 'utf-8');
    tipsData = JSON.parse(raw);
    console.log(`Loaded ${tipsData.tips.length} tips`);
  } catch (err) {
    console.error('Failed to load tips:', err);
  }
}

async function loadEmbeddings() {
  try {
    const embPath = join(__dirname, '..', 'data', 'public', 'embeddings.json');
    if (!existsSync(embPath)) {
      console.warn('No embeddings.json found, using text search only');
      return;
    }
    const raw = await readFile(embPath, 'utf-8');
    const entries: EmbeddingEntry[] = JSON.parse(raw);
    embeddingsMap = new Map(entries.map(e => [e.tipId, e.vector]));
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

async function semanticSearch(query: string, limit = 20): Promise<string[] | null> {
  if (!openai || embeddingsMap.size === 0) return null;

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryVec = response.data[0].embedding;

    const scored: { id: string; score: number }[] = [];
    for (const tip of tipsData.tips) {
      const vec = embeddingsMap.get(tip.id);
      if (vec) {
        scored.push({ id: tip.id, score: cosineSimilarity(queryVec, vec) });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.id);
  } catch (err) {
    console.error('Semantic search failed, falling back to text:', err);
    return null;
  }
}

// Rate limiting
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string, maxRequests = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap) {
    const recent = timestamps.filter(t => now - t < 60000);
    if (recent.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, recent);
  }
}, 300000);

// Text-based search fallback
function textSearch(query: string, limit = 20): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return tipsData.topTips?.slice(0, limit) || [];

  const scored = tipsData.tips.map(tip => {
    const text = `${tip.text} ${tip.category} ${tip.park} ${tip.tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const word of words) {
      if (text.includes(word)) score++;
    }
    if (text.includes(query.toLowerCase())) score += words.length;
    return { id: tip.id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const results = scored.filter(s => s.score > 0).slice(0, limit);
  if (results.length > 0) return results.map(r => r.id);
  return tipsData.topTips?.slice(0, limit) || [];
}

const app = express();

// Trust proxy for correct client IPs behind Traefik
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'dist')));

// Search API endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const trimmedQuery = query.trim();
  console.log(`Search: "${trimmedQuery}"`);

  // Try semantic search first, fall back to text
  const ids = await semanticSearch(trimmedQuery) || textSearch(trimmedQuery);
  res.json({ ids });
});

// Email subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    tips: tipsData.tips.length,
    topTips: tipsData.topTips?.length || 0,
    embeddingsLoaded: embeddingsMap.size,
    semanticSearch: openai !== null && embeddingsMap.size > 0,
  });
});

// SPA fallback - only known page routes
const PAGES = ['/', '/about.html', '/parks.html', '/dining.html', '/hotels.html', '/budget.html', '/planning.html', '/transportation.html'];
for (const page of PAGES) {
  app.get(page, (req, res) => res.sendFile(join(__dirname, '..', 'dist', 'index.html')));
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
