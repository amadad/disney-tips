# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Pipeline (runs daily via cron at 6 AM UTC)
npm run fetch      # Fetch new videos via RSS + Apify transcripts
npm run extract    # Extract tips from transcripts using Gemini
npm run backfill   # Retry fetching transcripts for videos missing them
npm run pipeline   # Run both fetch and extract

# Frontend
npm run dev        # Start dev server (localhost:5173) - hot reload
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build (localhost:4173)
```

## Hosting (Hetzner)

- **Live site**: https://disney.bound.tips/
- Static files served from `dist/` via bind mount to nginx container (auto-updates, no restart needed)
- Pipeline runs daily at 6 AM UTC via cron
- After manual changes: `npm run build` to update dist/

```bash
# Cron job (already configured)
0 6 * * * cd /home/deploy/base/projects/disney-tips && source ~/.nvm/nvm.sh && npm run pipeline && npm run build >> /home/deploy/base/logs/disney-tips.log 2>&1
```

## Architecture

This is a **batch-first, static-second** Disney tips aggregator:

1. **Pipeline** (`scripts/`) - Runs daily via cron
   - Fetches videos from 10 Disney YouTube channels via RSS feeds
   - Extracts transcripts via Apify YouTube Transcript Ninja
   - Uses Gemini 2.5 Flash Lite to extract structured tips with priority/season metadata
   - Filters out non-Disney content (Universal, generic travel)
   - Saves results to `data/`

2. **Frontend** (`src/`, `index.html`) - Minimal Vite static site
   - Loads pre-computed `data/public/tips.json`
   - Client-side filtering by category, park, priority, season, and search
   - Disney-themed UI with castle gradient header
   - Zero runtime API calls

### Key Files

```
shared/
  types.ts           # Shared types for both pipeline and frontend

scripts/
  types.ts           # Re-exports from shared/types.ts
  fetch-videos.ts    # RSS feed parsing + Apify transcript fetching
  extract-tips.ts    # Gemini-powered tip extraction with structured schema
  backfill-transcripts.ts  # Retry missing transcripts

data/
  public/            # Deployed to production
    tips.json        # Extracted structured tips (~1700+ tips)
  pipeline/          # NOT deployed (repo-only)
    videos.json      # Raw video metadata + transcripts
    processed-videos.json  # Ledger of processed videos

src/
  types.ts           # Re-exports from shared/types.ts
  main.ts            # Frontend application with filters
  styles.css         # External stylesheet

dist/               # Production build output (served by web server)
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
YouTube RSS → Apify → videos.json → Gemini API → tips.json → Static Frontend
     ↑                  (pipeline/)                 (public/)        ↑
  (daily cron)                                              (dist/ served)
```

## Environment Variables

Stored in `.env.local`:

```bash
APIFY_API_TOKEN=     # Apify API token for transcript fetching
GEMINI_API_KEY=      # Google AI Studio API key for tip extraction
GEMINI_MODEL=        # Optional: override model (default: gemini-2.5-flash-lite)
```

## Adding a Channel

Edit `shared/types.ts`:

```typescript
export const DISNEY_CHANNELS = {
  'ChannelName': 'UC_CHANNEL_ID',
  // ...
};
```

Get channel ID from: youtube.com/channel/UC... (the UC... part)
