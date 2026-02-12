
# Proposal: Fix dist/ staleness — build after pipeline

## Problem

Spec 001 fixed `lastUpdated`/`lastChecked` semantics in `data/public/tips.json` and `data/pipeline/videos.json`. The pipeline scripts now write honest timestamps. However, **the live site still serves stale data** because:

1. **`dist/` is not rebuilt after the pipeline runs.** The pipeline writes to `data/public/tips.json`, but the live site serves from `dist/` — only updated by `npm run build` (Vite copies `data/public/*` into `dist/` via `publicDir: 'data/public'`). Without a build after the pipeline, served data stays stale indefinitely.

2. **Current state:** `data/public/tips.json` has `lastUpdated: 2026-02-10` with 1950 tips, but `dist/tips.json` has `lastUpdated: 2026-02-01` with only 1831 tips. The live site at disney.bound.tips is 9+ days behind what the pipeline has already produced.

3. **No guard checks dist/ freshness.** The existing `check-staleness.ts` only reads `data/public/tips.json`. Even when it passes, `dist/` can be arbitrarily stale.

4. **The automation is broken.** The systemd timer (`disney-tips-pipeline.timer`) is inactive. The cron job references a stale path (`/home/deploy/base/projects/disney-tips`) instead of the actual repo at `/home/deploy/scty-repos/web-disney`.

## Scope

### In scope
- Wire `npm run build` into the pipeline so `dist/` auto-updates after extraction
- Add a dist-vs-source freshness guard to `check-staleness.ts`
- Fix the systemd timer to point at the correct repo path and include the build step
- Immediate `npm run build` to unblock the live site right now

### Out of scope
- Tip extraction logic, Gemini prompts, or `lastUpdated`/`lastChecked` semantics (settled in spec 001)
- Frontend UI changes
- Docker/nginx/Traefik config (the `dist/` bind mount already works — no restart needed)

## Approach

1. **Add `pipeline:deploy` npm script**: `fetch → extract → build → check-staleness`. This becomes the automation target. Keep `pipeline` as-is for backward compat (it skips the build).
2. **Extend `check-staleness.ts`** with a `--check-dist` flag that compares `dist/tips.json.lastChecked` against `data/public/tips.json.lastChecked` and fails if they differ (meaning build didn't run after extract).
3. **Fix the systemd timer** (`disney-tips-pipeline.service`) to run `npm run pipeline:deploy` from `/home/deploy/scty-repos/web-disney`.
4. **Run `npm run build` immediately** to sync `dist/` with the current pipeline output.

