# agents.md

Instructions for AI agents working on this repository.

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
- Static files served from `dist/`
- Pipeline runs daily at 6 AM UTC via cron
- After changes: `npm run build` to update dist/

```bash
# Cron job (already configured)
0 6 * * * npm run pipeline >> /var/log/disney-tips.log 2>&1
```

## Architecture

Batch-first, static-second Disney tips aggregator:

1. **Pipeline** (`scripts/`) - Daily cron
   - RSS feeds from 10 Disney YouTube channels
   - Transcripts via Apify YouTube Transcript Ninja
   - Gemini 2.5 Flash Lite extracts structured tips
   - Saves to `data/`

2. **Frontend** (`src/`, `index.html`) - Static Vite site
   - Loads `data/public/tips.json`
   - Client-side filtering
   - Zero runtime API calls

## Key Files

```
scripts/
  fetch-videos.ts         # RSS + Apify transcript fetching
  extract-tips.ts         # Gemini tip extraction
  backfill-transcripts.ts # Retry missing transcripts

data/
  public/tips.json        # Production tips (~1400)
  pipeline/videos.json    # Raw video data + transcripts

src/
  main.ts                 # Frontend app
  styles.css              # Styles

dist/                     # Production build (served)
```

## Environment

`.env.local`:
```bash
APIFY_API_TOKEN=     # Apify for transcripts
GEMINI_API_KEY=      # Gemini for extraction
```

## Data Flow

```
YouTube RSS → Apify → videos.json → Gemini → tips.json → dist/
```
