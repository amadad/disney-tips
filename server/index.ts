import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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

let tipsData: TipsData;

function loadTips() {
  const tipsPath = join(__dirname, '..', 'data', 'public', 'tips.json');
  tipsData = JSON.parse(readFileSync(tipsPath, 'utf-8'));
  console.log(`Loaded ${tipsData.tips.length} tips`);
}

// Reload tips periodically (every hour)
loadTips();
setInterval(loadTips, 60 * 60 * 1000);

const app = express();
app.use(express.json());

// Serve static files from dist (production build)
app.use(express.static(join(__dirname, '..', 'dist')));

// Search API endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const trimmedQuery = query.trim();
  console.log(`Search: "${trimmedQuery}"`);

  try {
    // Create a condensed version of tips for the prompt
    const tipSummaries = tipsData.tips.map(t => ({
      id: t.id,
      text: t.text.slice(0, 200), // Truncate long tips
      category: t.category,
      park: t.park
    }));

    const prompt = `You are a Disney tips search engine. A user is searching for: "${trimmedQuery}"

Find the 20 most relevant tips from this list. Consider:
- Semantic relevance (meaning, not just keyword matching)
- If searching for "rope drop", include tips about arriving early, being first in line
- If searching for "food", include dining tips, restaurants, snacks
- If searching for a specific park, prioritize tips for that park

Tips:
${JSON.stringify(tipSummaries)}

Return JSON with the IDs of the 20 most relevant tips, ranked by relevance:
{"ids": ["id1", "id2", ...]}

If the query doesn't match any tips well, return the most popular/useful general tips.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) {
      return res.json({ ids: tipsData.topTips?.slice(0, 20) || [] });
    }

    const result = JSON.parse(text);
    res.json({ ids: result.ids || [] });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Email subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
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
    topTips: tipsData.topTips?.length || 0
  });
});

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
