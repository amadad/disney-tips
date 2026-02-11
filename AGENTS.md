I don't have write permission to AGENTS.md. Here's the updated content and a summary of what changed:

---

## Updated AGENTS.md

```markdown
# AGENTS.md - Project Context

This file contains learned patterns, gotchas, and context for AI agents working on this project.
Night Nurse updates this file nightly with learnings from the day's work.

## Project Overview

Disney tips aggregator that extracts actionable tips from Disney YouTube channels. Batch-first pipeline (Apify + Gemini) generates static JSON consumed by a minimal Vite frontend.

## Tech Stack

- **Pipeline**: TypeScript scripts in `scripts/`, run via tsx
- **Frontend**: Vite + vanilla TypeScript, minimal dependencies
- **APIs**: Apify (transcripts), Gemini 2.5 Flash Lite (tip extraction)
- **Hosting**: Static files served from `dist/` via nginx container

## Key Patterns

- Types shared via `shared/types.ts`, re-exported in `scripts/types.ts` and `src/types.ts`
- Data split: `data/pipeline/` (repo-only) vs `data/public/` (deployed)
- RSS feeds parsed directly, no YouTube API needed
- Gemini structured output with zod schemas for tip extraction
- Footer elements added dynamically via JS (`setupFooterRssLink()` pattern) rather than static HTML
- **Two-timestamp pattern**: `lastUpdated` = when new content was last added (advances only on deltas); `lastChecked` = when the pipeline last ran (always current). This prevents a "pipeline ran but found nothing new" from looking like fresh data.
- Pipeline scripts always load previous state from disk before writing, to preserve values across no-delta runs

## Recent Completions

### Staleness Monitoring (001) - Completed 2026-02-10
Fixed `lastUpdated` being stuck at 2026-02-01 by distinguishing "pipeline ran" from "new content found":
- Added `lastChecked: string` to `TipsData` and `VideosData` in `shared/types.ts`
- `extract-tips.ts` and `fetch-videos.ts` now load previous `lastUpdated` and only advance it when `newTips.length > 0` / `newVideos.length > 0`
- `lastChecked` always set to current run time (independent of content changes)
- New `scripts/check-staleness.ts`: reads `tips.json`, accepts `--threshold <days>` (default 3), exits 0 if fresh, 1 if stale
- `npm run pipeline` now includes staleness check at the end (`fetch && extract && check-staleness`)
- All 20 Night Nurse iterations passed cleanly on first attempt

### RSS Feed (001) - Completed 2026-02-09
Added RSS 2.0 feed at `data/public/feed.xml` with:
- 50 most recent tips, XML escaping, RFC 822 dates
- Channel image, categories, proper guid elements
- Feed copied to `dist/feed.xml` on build
- Frontend: `<link rel="alternate">` autodiscovery + footer RSS link with SVG icon

## Gotchas

### Claude Code Permission Grants
Night Nurse initially failed on the RSS feed spec (Jan 31) due to Claude Code tool permission issues — not filesystem permissions. This caused 40+ consecutive retries on the same error before eventually succeeding on a fresh attempt. **Agents must bail out after 3 failed retries on the same error.**

### Pipeline State Preservation
When modifying pipeline scripts (`fetch-videos.ts`, `extract-tips.ts`), always load existing data from disk *before* processing. If you write the output file without loading previous state first, you'll lose `lastUpdated` and other accumulated metadata on no-delta runs.

### check-staleness.ts Exit Codes
- 0 = OK (fresh, below threshold)
- 1 = STALE (exceeds threshold)
- 2 = Error (missing file, invalid JSON, bad date, bad args)

The `&&` chaining in `npm run pipeline` means exit 1 (stale) will stop downstream commands — this is intentional as a deployment guard.

### RSS Feed Implementation
- `escapeXml()` must handle `&`, `<`, `>`, `"`, and `'` characters
- `pubDate` must be RFC 822 format (not ISO 8601)
- RSS 2.0 requires `channel` wrapper with `title`, `link`, `description`
- Items need `guid` with `isPermaLink="false"` for non-URL identifiers

### Spec Lifecycle
- Completed specs should be moved from `specs/active/` to `specs/archive/`
- Log files can bloat with failed iterations — consider truncating on completion

## Testing

No automated tests yet. Manual testing via:
- `npm run fetch` - should update `data/pipeline/videos.json`
- `npm run extract` - should update `data/public/tips.json` and `data/public/feed.xml`
- `npm run check-staleness` - should report staleness status (exit 0 or 1)
- `npm run build` - should generate `dist/` including `feed.xml`

## Deployment

- Auto-deploys on build (nginx bind mount to `dist/`)
- Cron runs pipeline daily at 6 AM + 6 PM UTC
- No container restart needed after `npm run build`
- `npm run pipeline` includes staleness guard — will fail if data is older than threshold

---
*Last updated by Night Nurse Review: 2026-02-10*
```

---

## Summary of Changes

1. **Fixed malformed file** — Previous AGENTS.md contained meta-commentary about the update wrapped around a code fence, rather than being a proper markdown file. Cleaned up to be the actual content.

2. **Added two-timestamp pattern** (Key Patterns) — The `lastUpdated` vs `lastChecked` distinction is the core architectural insight from today's work. Critical for future pipeline modifications.

3. **Added "Pipeline State Preservation" gotcha** — Load previous state before writing. This was the root cause of the original bug (`lastUpdated` stuck at 2026-02-01) and will bite anyone who modifies the pipeline scripts without understanding this pattern.

4. **Added check-staleness exit codes gotcha** — Documents the 0/1/2 exit code contract and explains why exit 1 (stale) intentionally breaks `&&` chains in the pipeline script.

5. **Added Staleness Monitoring completion entry** — Documents the full spec 001 staleness work (20 iterations, all clean).

6. **Updated Testing section** — Added `npm run check-staleness` to the manual testing list.

7. **Updated Deployment section** — Noted that `npm run pipeline` now includes the staleness guard.

8. **No learnings from AI conversations** — The Clawdbot sessions were about Orb/Mission Control, completely unrelated to web-disney.
