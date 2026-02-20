# Disney Parks Tips

> Diátaxis: reference

Curated Disney World & Disneyland tips extracted from expert YouTube channels using AI.

## Live Site

- **Production**: https://disney.bound.tips/
- **Health**: https://disney.bound.tips/api/health

## Commands

```bash
# Pipeline
npm run fetch            # RSS + transcript fetch (10 YouTube channels)
npm run extract          # Gemini 2.5 Flash Lite tip extraction
npm run embed            # Generate OpenAI embeddings for semantic search
npm run backfill         # Retry videos with missing transcripts
npm run check-staleness  # Validate freshness / dist sync
npm run verify-live      # Check live site matches local data
npm run pipeline         # fetch -> extract -> check-staleness
npm run pipeline:deploy  # fetch -> extract -> embed -> build -> check-staleness -> verify-live

# Frontend
npm run dev
npm run build
npm run preview

# Tests
npm test
```

## Environment Variables

Stored in `.env.local`:

Required:

- `GEMINI_API_KEY` – Google AI Studio API key (tip extraction)
- `OPENAI_API_KEY` – OpenAI API key (embeddings for semantic search)

Optional:

- `GEMINI_MODEL` (default: `gemini-2.5-flash-lite`)
- `RESEND_API_KEY` – Resend API key (email subscriptions)
- `RESEND_AUDIENCE_ID` – Resend audience ID
- `SITE_URL` (default: `https://disney.bound.tips`)
- `PORT` (default: `3000`)
- `WARP_PROXY_HOST` (default: `127.0.0.1`)
- `WARP_PROXY_PORT` (default: `1080`)
- `DENO_PATH` (default: `~/.deno/bin/deno`)
- `TRANSCRIPT_STRICT_PREFLIGHT` (default: `true`)
- `TRANSCRIPT_USE_DENO_RUNTIME` (default: `true`)
- `TRANSCRIPT_TIMEOUT_MS` (default: `30000`)

## Architecture

```text
YouTube RSS → yt-dlp (+ WARP proxy) → data/pipeline/videos.json
           → Gemini extraction → data/public/tips.json
           → OpenAI embeddings → data/public/embeddings.json
           → Vite build → dist/
           → Express server (port 3000) → Traefik → disney.bound.tips
```

**Pipeline** (`scripts/`): Runs twice daily via systemd timer. Fetches videos from 10 Disney YouTube channels, extracts structured tips with Gemini, generates embeddings for semantic search.

**Server** (`server/index.ts`): Express app serving static files from `dist/`, plus API endpoints:
- `POST /api/search` – Semantic search (OpenAI embeddings) with text fallback
- `POST /api/subscribe` – Email subscription via Resend
- `GET /api/health` – Health check (tip count, embeddings, semantic search status)

**Frontend** (`src/`): Vite static site with client-side filtering by category, park, priority, season, and search.

Key files:

```text
scripts/
  fetch-videos.ts, extract-tips.ts, embed-tips.ts, dedupe-tips.ts,
  backfill-transcripts.ts, check-staleness.ts, verify-live.ts, prerender.ts
  lib/transcript.ts, lib/state.ts

server/index.ts                  Express server

data/
  pipeline/videos.json           Raw video metadata + transcripts
  pipeline/processed-videos.json Ledger of processed videos
  public/tips.json               Extracted structured tips
  public/embeddings.json         OpenAI embeddings for semantic search
  public/feed.xml                RSS 2.0 feed
  public/health.json, sitemap.xml, robots.txt

src/main.ts, src/styles.css      Frontend application
shared/types.ts                  Shared types (pipeline + frontend)
```

## Deploy

Container uses bind-mounted `dist/` and `data/public/`, so pipeline rebuilds go live immediately without a container restart.

```bash
npm run pipeline:deploy    # Full pipeline with live verification
npm run build              # Just rebuild static files
npm run verify-live        # Check live site matches local data
```

## Troubleshooting

- Verify yt-dlp: `yt-dlp --version`
- Verify proxy: `nc -z 127.0.0.1 1080`
- Verify Deno path: `ls ~/.deno/bin/deno`
- Check live health: `curl https://disney.bound.tips/api/health`
- Check container mounts: `docker inspect web-disney --format '{{json .Mounts}}'`
- Use degraded mode: `TRANSCRIPT_STRICT_PREFLIGHT=false`
