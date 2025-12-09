# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Pipeline (run manually or via GitHub Actions)
npm run fetch      # Fetch new videos via RSS + youtubei.js transcripts
npm run extract    # Extract tips from transcripts using Gemini
npm run pipeline   # Run both fetch and extract

# Frontend
npm run dev        # Start dev server (localhost:5173)
npm run build      # Build for production
npm run preview    # Preview production build
```

## Architecture

This is a **batch-first, static-second** Disney tips aggregator:

1. **Pipeline** (`scripts/`) - Runs daily via GitHub Actions
   - Fetches videos from 5 Disney YouTube channels via RSS feeds (free, no API key)
   - Extracts transcripts via `youtubei.js` (InnerTube wrapper, no API key)
   - Uses Gemini Flash Lite to extract structured tips with priority/season metadata
   - Filters out non-Disney content (Universal, generic travel)
   - Commits results to `data/`

2. **Frontend** (`src/`, `index.html`) - Minimal Vite static site
   - Loads pre-computed `data/tips.json`
   - Client-side filtering by category, priority, season, and search
   - Disney-themed UI with castle gradient header
   - Zero runtime API calls
   - Deployed to GitHub Pages at `/disney-tips/`

### Key Files

```
scripts/
  types.ts           # Shared types, channel config, enums
  fetch-videos.ts    # RSS feed parsing + youtubei.js transcript fetching
  extract-tips.ts    # Gemini-powered tip extraction with structured schema

data/
  videos.json        # Raw video metadata + transcripts (75 videos)
  tips.json          # Extracted structured tips (287 tips)

src/
  main.ts            # Frontend application with filters

.github/workflows/
  update-tips.yml    # Daily cron job (6 AM UTC)
  deploy.yml         # GitHub Pages deployment
```

### Data Schema

Tips include:
- `category`: parks, dining, hotels, budget, planning, transportation
- `park`: magic-kingdom, epcot, hollywood-studios, animal-kingdom, disney-springs, water-parks, disneyland, california-adventure, all-parks
- `priority`: high (saves 30+ min/$50+), medium, low
- `season`: year-round, christmas, halloween, flower-garden, food-wine, festival-arts, summer
- `tags`: lowercase hyphenated (rope-drop, lightning-lane, quick-service)

### Data Flow

```
YouTube RSS → videos.json → Gemini API → tips.json → Static Frontend
     ↑                                                      ↑
  (daily cron)                                    (GitHub Pages deploy)
```

## Environment Variables

```bash
GEMINI_API_KEY=      # Google AI Studio API key (only key needed)
```

For GitHub Actions, add as repository secret: Settings → Secrets → Actions → `GEMINI_API_KEY`

## Adding a Channel

Edit `scripts/types.ts`:

```typescript
export const DISNEY_CHANNELS = {
  'ChannelName': 'UC_CHANNEL_ID',
  // ...
};
```

Get channel ID from: youtube.com/channel/UC... (the UC... part)

## Deployment

- **Live site**: https://amadad.github.io/disney-tips/
- Deploys automatically on push to main
- Uses Vite with `base: '/disney-tips/'` for GitHub Pages subpath
