# agents.md

> Diátaxis: reference

Instructions for AI agents working in this repository.

## Working Directory

- Repo path: `/home/deploy/repos/web-disney`

## Commands

```bash
# Pipeline
npm run fetch            # RSS + transcript fetch
npm run extract          # Gemini tip extraction
npm run embed            # Generate Gemini embeddings for semantic search
npm run backfill         # Retry missing transcripts
npm run check-staleness  # Validate freshness / dist sync
npm run verify-live      # Check live site matches local data
npm run pilot -- readiness # Planning pilot launch readiness
npm run pilot -- summary   # Planning pilot validation ledger
npm run pipeline         # fetch -> extract -> check-staleness
npm run pipeline:deploy  # fetch -> extract -> embed -> build -> check-staleness -> verify-live

# Frontend
npm run dev
npm run build
npm run preview

# Tests
npm test
```

## Hosting / Deployment

- Live site: `https://disney.bound.tips/`
- Container: Express server (Dockerfile), port 3000, behind Traefik
- `dist/` and `data/public/` are bind-mounted into the container — pipeline rebuilds go live immediately
- `data/private/` is mounted writable for planning pilot lead capture and is git-ignored
- Health endpoint: `https://disney.bound.tips/api/health`
- Timer: systemd `disney-tips-pipeline.timer` (6 AM + 6 PM UTC)
- Deploy-safe pipeline: `npm run pipeline:deploy`

## Runtime Requirements (transcript fetch)

- `yt-dlp` in PATH
- SOCKS5 proxy (WARP) reachable at `127.0.0.1:1080` (defaults)
- Deno runtime at `~/.deno/bin/deno` (default)

Configurable env vars:

```bash
WARP_PROXY_HOST=127.0.0.1
WARP_PROXY_PORT=1080
DENO_PATH=~/.deno/bin/deno
TRANSCRIPT_STRICT_PREFLIGHT=true
TRANSCRIPT_USE_DENO_RUNTIME=true
TRANSCRIPT_TIMEOUT_MS=30000
```

## Data/Script Map

```text
scripts/fetch-videos.ts          RSS + transcript fetch (Disney YouTube channels)
scripts/extract-tips.ts          Gemini 2.5 Flash Lite tip extraction
scripts/embed-tips.ts            Gemini embeddings for semantic search
scripts/dedupe-tips.ts           Deduplicate tips
scripts/backfill-transcripts.ts  Retry missing transcripts
scripts/check-staleness.ts       Staleness checks (freshness + dist sync)
scripts/verify-live.ts           Post-deploy: verify live site matches local data
scripts/prerender.ts             Inject tips into static HTML pages
scripts/clean-tips.ts            Filter tips by quality, regenerate feed/sitemap/health (npm run clean:tips)
scripts/flatten-to-raw.ts        Backfill videos.json -> raw/ markdown corpus (LLM-wiki sources layer)
scripts/planning-pilot.ts        Planning pilot readiness + validation ledger (npm run pilot)
scripts/lib/transcript.ts        Shared transcript runtime + parser
scripts/lib/state.ts             Shared lastUpdated logic

server/index.ts                  Express server: static files, /api/search, /api/subscribe, /api/planning-request, /api/health
shared/planningRequest.ts        Planning pilot intake validation + notification formatting
design.md                        Frontend style reference; keep the UI Disney-safe, sticker/ticket themed, and concise
```

## Operational Notes

- Script failures are fail-fast (`process.exit(1)`), suitable for timers/services.
- `check-staleness` exit codes: `0` = OK, `1` = stale, `2` = error
- `verify-live` compares local `data/public/tips.json` with what the live site serves. Fails if drift > 5 minutes.
- YouTube RSS feeds occasionally return transient 500/404 — pipeline continues with available feeds.
- Planning pilot leads are stored in git-ignored `data/private/planning-requests.jsonl`; set `PLAN_REQUEST_RECIPIENT` before outreach so Resend notifications reach the operator.
- Set `PLAN_PAYMENT_URL` to return a payment link after planning intake; otherwise use manual follow-up.
