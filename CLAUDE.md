# CLAUDE.md

> Diátaxis: reference

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Pipeline
npm run fetch            # Fetch new videos via RSS + yt-dlp transcripts
npm run extract          # Extract tips from transcripts using Gemini
npm run backfill         # Retry fetching transcripts for videos missing them
npm run check-staleness  # Validate freshness / dist sync
npm run pipeline         # fetch -> extract -> check-staleness
npm run pipeline:deploy  # fetch -> extract -> embed -> build -> check-staleness -> verify-live
npm run verify-live      # Check live site matches local data

# Frontend
npm run dev
npm run build
npm run preview

# Tests
npm test
```

## Hosting (Hetzner)

- **Live site**: https://disney.bound.tips/
- **Container**: Express server (Dockerfile), port 3000, behind Traefik
- **Volumes**: `dist/` and `data/public/` are bind-mounted — pipeline rebuilds go live immediately (no container restart needed)
- **Health**: `https://disney.bound.tips/api/health` returns tip count, embeddings status, semantic search status
- **Timer**: systemd `disney-tips-pipeline.timer` (6 AM + 6 PM UTC)
- **Deploy**: `npm run pipeline:deploy` (includes verify-live check at the end)
- **Manual deploy**: `npm run build && npm run verify-live`
- **Troubleshooting**: If verify-live fails with STALE, check that `dist/` is bind-mounted (not baked into image). Run `docker inspect web-disney --format '{{json .Mounts}}'` to verify.

## Architecture

This is a **batch-first** Disney tips aggregator with an Express server:

1. **Pipeline** (`scripts/`) - Runs twice daily via systemd timer
   - Fetches videos from 10 Disney YouTube channels via RSS feeds
   - Extracts transcripts via yt-dlp with WARP proxy (SOCKS5 at 127.0.0.1:1080)
   - Uses Gemini 2.5 Flash Lite to extract structured tips with priority/season metadata
   - Generates OpenAI embeddings for semantic search
   - Filters out non-Disney content (Universal, generic travel)
   - Saves results to `data/`, builds static site to `dist/`

2. **Server** (`server/index.ts`) - Express app (port 3000)
   - Serves static files from `dist/`
   - `POST /api/search` — Semantic search (OpenAI embeddings) with text fallback
   - `POST /api/subscribe` — Email subscription via Resend
   - `GET /api/health` — Health check

3. **Frontend** (`src/`, `index.html`) - Vite static site
   - Client-side filtering by category, park, priority, season, and search
   - Disney-themed UI with castle gradient header

### Key Files

```
shared/types.ts              # Shared types (pipeline + frontend)
scripts/
  fetch-videos.ts            # RSS feed parsing + yt-dlp transcript fetching
  extract-tips.ts            # Gemini-powered tip extraction
  embed-tips.ts              # OpenAI embeddings for semantic search
  dedupe-tips.ts             # Tip deduplication
  backfill-transcripts.ts    # Retry missing transcripts
  check-staleness.ts         # Freshness + dist sync checks
  verify-live.ts             # Post-deploy live site verification
  prerender.ts               # Inject tips into static HTML
  lib/transcript.ts          # Transcript runtime + parser
  lib/state.ts               # Shared lastUpdated logic
server/index.ts              # Express server (search, subscribe, health)
data/
  public/                    # Bind-mounted into container
    tips.json                # Extracted structured tips (~2700 tips)
    embeddings.json          # OpenAI embeddings
    feed.xml                 # RSS 2.0 feed
  pipeline/                  # NOT deployed
    videos.json              # Raw video metadata + transcripts
    processed-videos.json    # Ledger of processed videos
src/main.ts, src/styles.css  # Frontend application
dist/                        # Bind-mounted into container
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
YouTube RSS → yt-dlp + WARP → videos.json → Gemini API → tips.json → Static Frontend
     ↑                          (pipeline/)                 (public/)        ↑
  (daily cron)                                                      (dist/ served)
```

## Environment Variables

Stored in `.env.local`:

```bash
# Required
GEMINI_API_KEY=               # Google AI Studio API key for tip extraction
OPENAI_API_KEY=               # OpenAI API key for embeddings (semantic search)

# Optional
GEMINI_MODEL=                 # Override model (default: gemini-2.5-flash-lite)
RESEND_API_KEY=               # Resend API key (email subscriptions)
RESEND_AUDIENCE_ID=           # Resend audience ID
SITE_URL=                     # Site URL for RSS feed (default: https://disney.bound.tips)
PORT=                         # Server port (default: 3000)

# Transcript runtime (optional overrides)
WARP_PROXY_HOST=127.0.0.1
WARP_PROXY_PORT=1080
DENO_PATH=~/.deno/bin/deno
TRANSCRIPT_STRICT_PREFLIGHT=true   # fail pipeline if preflight warns/fails
TRANSCRIPT_USE_DENO_RUNTIME=true
TRANSCRIPT_TIMEOUT_MS=30000
```

Transcripts are fetched via `yt-dlp` using a WARP SOCKS5 proxy (`127.0.0.1:1080`) and Deno runtime (`~/.deno/bin/deno`). No API tokens needed for transcript fetching.

## Transcript Troubleshooting

- Run `yt-dlp --version` to verify binary availability.
- Verify proxy is up: `nc -z 127.0.0.1 1080`.
- Verify Deno path exists: `ls ~/.deno/bin/deno`.
- If the proxy is temporarily down and you want best-effort mode, set `TRANSCRIPT_STRICT_PREFLIGHT=false`.
- In strict mode, failed preflight exits with non-zero status and stops pipeline chaining.

## Adding a Channel

Edit `shared/types.ts`:

```typescript
export const DISNEY_CHANNELS = {
  'ChannelName': 'UC_CHANNEL_ID',
  // ...
};
```

Get channel ID from: youtube.com/channel/UC... (the UC... part)
