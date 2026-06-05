# Disney Decision Desk

> Diátaxis: reference

Ask-first Disney decision support backed by curated Walt Disney World & Disneyland tips extracted from expert YouTube channels.

## Live Site

- **Production**: https://disney.bound.tips/
- **Health**: https://disney.bound.tips/api/health

## Commands

```bash
# Pipeline
npm run fetch            # RSS + transcript fetch (Disney YouTube channels)
npm run extract          # Gemini 2.5 Flash Lite tip extraction
npm run clean:tips       # Apply deterministic quality gates and regenerate public feed/sitemap/health
npm run embed            # Generate Gemini embeddings for semantic search
npm run backfill         # Retry videos with missing transcripts
npm run check-staleness  # Validate freshness / dist sync
npm run verify-live      # Check live site matches local data
npm run pilot -- readiness # Decision-plan pilot launch readiness
npm run pilot -- summary   # Decision-plan pilot validation ledger
npm run pipeline         # fetch -> extract -> check-staleness
npm run pipeline:deploy  # fetch -> backfill -> extract -> dedupe -> embed -> build -> check-staleness -> verify-live

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

- `GEMINI_API_KEY` – Google AI Studio API key (tip extraction + embeddings)

Optional:

- `GEMINI_MODEL` (default: `gemini-2.5-flash-lite`)
- `RESEND_API_KEY` – Resend API key (email subscriptions and planning-request notifications)
- `RESEND_AUDIENCE_ID` – Resend audience ID
- `PLAN_REQUEST_RECIPIENT` – email address for new manual planning requests; required before outreach
- `RESEND_FROM_EMAIL` – optional sender for planning-request notification emails
- `PLAN_PAYMENT_URL` – optional payment link returned after a planning request
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
           → Gemini embeddings → data/public/embeddings.json
           → Vite build → dist/
           → Express server (port 3000) → Traefik → disney.bound.tips
```

**Pipeline** (`scripts/`): Runs via systemd timer. Fetches videos from the curated Disney YouTube source roster in `shared/types.ts`, extracts structured tips with Gemini, generates embeddings for semantic search.

**Server** (`server/index.ts`): Express app serving static files from `dist/`, plus API endpoints:
- `POST /api/ask` – Ask-first sourced preview for a natural-language Disney planning decision
- `POST /api/search` – Semantic search (Gemini embeddings) with text fallback
- `POST /api/embed-query` – Legacy Gemini query-vector endpoint; main UI uses `/api/search` and `/api/ask`
- `POST /api/subscribe` – Email subscription via Resend
- `POST /api/planning-request` – Captures the $39 manual decision-plan request to `data/private/planning-requests.jsonl`
- `GET /api/health` – Health check (tip count, embeddings, semantic search status)

**Frontend** (`src/`, `index.html`, `plan.html`, `tips.html`, `design.md`): Vite static site with an Ask-first decision desk, a paid human-reviewed decision-plan page with sample proof and intake form, and a searchable research archive with category/park filters and semantic/text search.

Key files:

```text
scripts/
  fetch-videos.ts, extract-tips.ts, embed-tips.ts, dedupe-tips.ts,
  backfill-transcripts.ts, check-staleness.ts, verify-live.ts, prerender.ts
  lib/transcript.ts, lib/state.ts

server/index.ts                  Express server
shared/decisionPreview.ts        Ask-first sourced preview contract + decision area classifier
shared/planningRequest.ts        Manual decision-plan request validation + email formatting
shared/tipSearch.ts              Shared category/park/text search helpers
design.md                        Theme-park planning notebook style reference

data/
  pipeline/videos.json           Raw video metadata + transcripts
  pipeline/processed-videos.json Ledger of processed videos
  public/tips.json               Extracted structured tips (~4,000)
  public/embeddings.json         Gemini embeddings loaded server-side for semantic search
  private/planning-requests.jsonl Ignored local/private lead capture for the decision-plan pilot
  public/feed.xml                RSS 2.0 feed
  public/health.json, sitemap.xml, robots.txt

src/main.ts, src/styles.css      Frontend application
shared/types.ts                  Shared types (pipeline + frontend)

docs/planning-pilot.md           Manual decision-plan pilot operation and validation ledger
docs/first-customer-outreach.md  First five customer outreach scripts
```

## Deploy

Container uses bind-mounted `dist/` and `data/public/`, so pipeline rebuilds go live immediately without a container restart. The planning request flow also needs writable `data/private/` mounted at `/app/data/private` so lead captures persist across container rebuilds.

```bash
npm run pipeline:deploy    # Full pipeline with live verification
npm run build              # Just rebuild static files
npm run verify-live        # Check live site matches local data
npm run pilot -- readiness # Check decision-plan pilot env/validation status
```

## Troubleshooting

- Verify yt-dlp: `yt-dlp --version`
- Verify proxy: `nc -z 127.0.0.1 1080`
- Verify Deno path: `ls ~/.deno/bin/deno`
- Check live health: `curl https://disney.bound.tips/api/health`
- Check container mounts: `docker inspect web-disney --format '{{json .Mounts}}'`
- Use degraded mode: `TRANSCRIPT_STRICT_PREFLIGHT=false`
