# agents.md

> Diátaxis: reference

Instructions for AI agents working in this repository.

## Working Directory

- Repo path: `/home/deploy/scty-repos/web-disney`

## Commands

```bash
# Pipeline
npm run fetch            # RSS + transcript fetch
npm run extract          # Gemini tip extraction
npm run embed            # Generate OpenAI embeddings for semantic search
npm run backfill         # Retry missing transcripts
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

## Hosting / Deployment

- Live site: `https://disney.bound.tips/`
- Container: Express server (Dockerfile), port 3000, behind Traefik
- `dist/` and `data/public/` are bind-mounted into the container — pipeline rebuilds go live immediately
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
scripts/fetch-videos.ts          RSS + transcript fetch (10 YouTube channels)
scripts/extract-tips.ts          Gemini 2.5 Flash Lite tip extraction
scripts/embed-tips.ts            OpenAI text-embedding-3-small for semantic search
scripts/dedupe-tips.ts           Deduplicate tips
scripts/backfill-transcripts.ts  Retry missing transcripts
scripts/check-staleness.ts       Staleness checks (freshness + dist sync)
scripts/verify-live.ts           Post-deploy: verify live site matches local data
scripts/prerender.ts             Inject tips into static HTML pages
scripts/lib/transcript.ts        Shared transcript runtime + parser
scripts/lib/state.ts             Shared lastUpdated logic

server/index.ts                  Express server: static files, /api/search, /api/subscribe, /api/health
```

## Operational Notes

- Script failures are fail-fast (`process.exit(1)`), suitable for timers/services.
- `check-staleness` exit codes: `0` = OK, `1` = stale, `2` = error
- `verify-live` compares local `data/public/tips.json` with what the live site serves. Fails if drift > 5 minutes.
- YouTube RSS feeds occasionally return transient 500/404 — pipeline continues with available feeds.
