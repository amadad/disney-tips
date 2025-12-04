# Disney World Tips

Curated Disney World tips extracted from expert YouTube channels using AI.

## How It Works

1. **Daily pipeline** fetches new videos from 5 Disney YouTube channels (via RSS, no API key)
2. **Gemini Flash Lite** extracts actionable tips from video transcripts
3. **Static frontend** displays searchable, filterable tips

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Gemini API key

# Run the pipeline (fetches videos + extracts tips)
npm run pipeline

# Start the frontend
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) - Only key needed |

## Project Structure

```
scripts/          # Data pipeline
  fetch-videos.ts   # RSS feed + transcript extraction (no API key)
  extract-tips.ts   # Gemini-powered tip extraction
  types.ts          # Shared types

data/             # Pre-computed data (committed to repo)
  videos.json       # Video metadata + transcripts
  tips.json         # Extracted tips

src/              # Frontend
  main.ts           # Vanilla TypeScript app
```

## Tip Categories

- **Parks** - Park-specific strategies and tips
- **Dining** - Restaurant and food recommendations
- **Hotels** - Resort and accommodation tips
- **Genie+** - Lightning Lane and Genie+ strategies
- **Budget** - Money-saving tips
- **Planning** - Trip planning advice
- **Transportation** - Getting around Disney

## YouTube Channels

- AllEars.net
- DFBGuide
- PixieDustedMom
- MillennialOnMainStreet
- DisneyInDetail

## Deployment

The frontend is a static site. Deploy to Vercel, Netlify, or any static host:

```bash
npm run build
# Deploy contents of dist/
```

GitHub Actions runs the pipeline daily and commits updated tips.

## License

MIT
