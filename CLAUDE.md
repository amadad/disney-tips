# CLAUDE.md

> Diátaxis: reference

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Pipeline
npm run fetch            # Fetch new videos via RSS + yt-dlp transcripts
npm run extract          # Extract tips from transcripts using Gemini
npm run clean:tips       # Apply deterministic quality gates and regenerate public feed/sitemap/health
npm run backfill         # Retry fetching transcripts for videos missing them
npm run embed            # Generate/prune Gemini embeddings for semantic search
npm run check-staleness  # Validate freshness / dist sync
npm run pipeline         # fetch -> extract -> check-staleness
npm run pipeline:deploy  # fetch -> backfill -> extract -> dedupe -> embed -> build -> check-staleness -> verify-live
npm run verify-live      # Check live site matches local data
npm run pilot -- readiness # Decision-plan pilot launch readiness
npm run pilot -- summary   # Decision-plan pilot validation ledger

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
- **Volumes**: `dist/` and `data/public/` are bind-mounted — pipeline rebuilds go live immediately (no container restart needed); `data/private/` is mounted writable for decision-plan pilot leads
- **Health**: `https://disney.bound.tips/api/health` returns tip count, embeddings status, semantic search status
- **Schedule**: none installed; run `npm run pipeline:deploy` manually
- **Deploy**: `npm run pipeline:deploy` (includes verify-live check at the end)
- **Manual deploy**: `npm run build && npm run verify-live`
- **Troubleshooting**: The container bind-mounts host `dist/` and `data/public/`, so rebuilding the Docker image alone does not refresh live tips. Re-run the host build (`npm run build`) after data changes. If verify-live fails with STALE, check that `dist/` is bind-mounted (not baked into image). Run `docker inspect web-disney --format '{{json .Mounts}}'` to verify.

## Architecture

This is a **batch-first** Disney decision desk with an Express server:

1. **Pipeline** (`scripts/`) - Runs manually; no host timer or cron is installed
   - Fetches videos from 17 Disney YouTube channels via RSS feeds
   - Attempts transcript extraction directly via yt-dlp; YouTube may block requests from the VPS
   - Backfills previously failed transcripts (max 3 retries per video, then skipped permanently)
   - Uses Gemini 2.5 Flash Lite to extract structured tips with priority/season metadata
   - Generates Gemini embeddings (256-dim, `gemini-embedding-001`) for semantic search, with checkpointed batches + retry-on-429 so reruns resume instead of starting over
   - Filters out non-Disney content (Universal, generic travel)
   - Saves results to `data/`, builds static site to `dist/`

2. **Server** (`server/index.ts`) - Express app (port 3000)
   - Serves static files from `dist/` and `data/public/`
   - `POST /api/ask` — Ask-first sourced preview for a natural-language Disney planning decision
   - `POST /api/search` — Server-side semantic search with text fallback
   - `POST /api/embed-query` — Legacy query-vector endpoint; main UI uses `/api/search` and `/api/ask`
   - `POST /api/subscribe` — Email subscription via Resend
   - `POST /api/planning-request` — Captures the $39 manual decision-plan request to ignored `data/private/planning-requests.jsonl`; optionally emails `PLAN_REQUEST_RECIPIENT` via Resend
   - `GET /api/health` — Health check

3. **Frontend** (`src/`, `index.html`, `plan.html`, `tips.html`) - Vite static site
   - Homepage leads with one natural-language Ask box and renders sourced snippets from `/api/ask`
   - Paid flow is a human-reviewed $39 decision plan delivered by email; `biggestDecision` is required
   - Tips archive remains the research layer, with category/park filters and pain-oriented suggested searches
   - Server-side semantic search calls `/api/search` and `/api/ask`, with text fallback when embeddings are unavailable
   - Theme-park planning notebook UI from `design.md`: light map background, ticket/sticker surfaces, black outlines, and no official Disney logos or character art

### Key Files

```
shared/types.ts              # Shared types (pipeline + frontend)
scripts/
  fetch-videos.ts            # RSS feed parsing + yt-dlp transcript fetching
  extract-tips.ts            # Gemini-powered tip extraction
  embed-tips.ts              # Gemini embeddings for semantic search (checkpointed, resumable)
  dedupe-tips.ts             # Tip deduplication
  backfill-transcripts.ts    # Retry missing transcripts (max 3 retries then skip)
  check-staleness.ts         # Freshness + dist sync checks
  verify-live.ts             # Post-deploy live site verification
  prerender.ts               # Inject tips into static HTML
  lib/transcript.ts          # Transcript runtime + parser
  lib/state.ts               # Shared lastUpdated logic
server/index.ts              # Express server (Gemini semantic search, subscribe, health)
shared/embeddings.ts         # Shared Gemini embedding config + helpers
shared/decisionPreview.ts    # Ask-first sourced preview contract + decision area classifier
shared/planningRequest.ts    # Decision-plan request validation + email formatting
shared/tipSearch.ts          # Shared category/park/text search helpers
design.md                    # Frontend style reference and Disney-safe visual rules
data/
  public/                    # Bind-mounted into container
    tips.json                # Extracted structured tips
    embeddings.json          # Gemini embeddings (256-dim, loaded server-side only)
    embeddings.meta.json     # Embedding model/signature guard for safe reloads
    feed.xml                 # RSS 2.0 feed
  private/                   # Git-ignored decision-plan pilot leads
  pipeline/                  # NOT deployed
    videos.json              # Raw video metadata + transcripts (git-ignored: ~60MB local cache, regenerated by fetch)
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
YouTube RSS → yt-dlp → videos.json → backfill → Gemini API → tips.json + embeddings.json → Static Frontend
                         (pipeline/)                            (public/)                          ↑
                                                                                       (dist/ served)
```

## Environment Variables

Stored in `.env.local`:

```bash
# Required
GEMINI_API_KEY=               # Google AI Studio API key for tip extraction + semantic embeddings

# Optional
GEMINI_MODEL=                 # Override model (default: gemini-2.5-flash-lite)
RESEND_API_KEY=               # Resend API key (email subscriptions + planning request notifications)
RESEND_AUDIENCE_ID=           # Resend audience ID
PLAN_REQUEST_RECIPIENT=       # required before outreach: decision-plan pilot lead notification recipient
RESEND_FROM_EMAIL=            # optional: sender for decision-plan pilot notification emails
PLAN_PAYMENT_URL=             # optional: payment link returned after a planning request
SITE_URL=                     # Site URL for RSS feed (default: https://disney.bound.tips)
PORT=                         # Server port (default: 3000)

# Transcript runtime (optional overrides)
DENO_PATH=~/.deno/bin/deno
TRANSCRIPT_STRICT_PREFLIGHT=true   # fail pipeline if preflight warns/fails
TRANSCRIPT_USE_DENO_RUNTIME=true
TRANSCRIPT_TIMEOUT_MS=30000
```

Transcripts are attempted directly via `yt-dlp` with the Deno runtime (`~/.deno/bin/deno`). YouTube may bot-block requests from the VPS. Gemini handles both extraction and embeddings; no API tokens are needed for transcript fetching.

## Transcript Troubleshooting

- Run `yt-dlp --version` to verify binary availability.
- Verify Deno path exists: `ls ~/.deno/bin/deno`.
- If Deno is unavailable and you want best-effort mode, set `TRANSCRIPT_STRICT_PREFLIGHT=false`.
- If yt-dlp reports a bot/sign-in wall, record the transcript as unavailable rather than inventing or inferring transcript content.
- In strict mode, failed preflight exits with non-zero status and stops pipeline chaining.
- Videos that fail transcript fetch 3 times are permanently skipped (tracked via `transcriptRetries` in videos.json). Most are shorts/live streams without subtitles.
- `npm run embed` now checkpoints after each batch. If Gemini returns a transient 429, rerun the command and it resumes from the saved `data/public/embeddings.json` + `embeddings.meta.json` state.

## Adding a Channel

Edit `DISNEY_CHANNEL_SOURCES` in `shared/types.ts`:

```typescript
export const DISNEY_CHANNEL_SOURCES = [
  {
    key: 'ChannelName',
    displayName: 'Channel Name',
    channelId: 'UC_CHANNEL_ID',
    focus: 'What this source is useful for',
  },
  // ...
];
```

`DISNEY_CHANNELS` and `DISNEY_CHANNEL_URLS` are derived from that metadata. Update `about.html` with the channel link and run `npm test`; `tests/source-config.test.ts` catches source-list drift.
