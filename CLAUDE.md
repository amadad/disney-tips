# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Pipeline (run manually or via GitHub Actions)
npm run fetch      # Fetch new videos via RSS (no API key needed)
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
   - Extracts transcripts via `youtube-transcript` (no API key)
   - Uses Gemini Flash Lite to extract structured tips
   - Commits results to `data/`

2. **Frontend** (`src/`, `index.html`) - Minimal Vite static site
   - Loads pre-computed `data/tips.json`
   - Client-side filtering by category and search
   - Zero runtime API calls

### Key Files

```
scripts/
  types.ts           # Shared types and channel config
  fetch-videos.ts    # RSS feed parsing + transcript fetching
  extract-tips.ts    # Gemini-powered tip extraction with Zod schema

data/
  videos.json        # Raw video metadata + transcripts
  tips.json          # Extracted structured tips

src/
  main.ts            # Frontend application

.github/workflows/
  update-tips.yml    # Daily cron job
```

### Data Flow

```
YouTube RSS → videos.json → Gemini API → tips.json → Static Frontend
     ↑                                                      ↑
  (daily cron)                                        (on deploy)
```

## Environment Variables

```bash
GEMINI_API_KEY=      # Google AI Studio API key (only key needed)
```

## Adding a Channel

Edit `scripts/types.ts`:

```typescript
export const DISNEY_CHANNELS = {
  'ChannelName': 'UC_CHANNEL_ID',
  // ...
};
```
