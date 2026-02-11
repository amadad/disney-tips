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

## Recent Completions

### RSS Feed (001) - Completed 2026-02-01
Added RSS 2.0 feed at `data/public/feed.xml` with:
- 50 most recent tips
- XML escaping via `escapeXml()` helper
- RFC 822 date formatting via `formatRfc822Date()` helper
- Channel image, categories, and proper guid elements
- Feed copied to `dist/feed.xml` on build

## Gotchas

### Claude Code Permission Grants
Night Nurse initially failed on the RSS feed spec (Jan 31) due to Claude Code permission issues. The filesystem permissions were fine (`-rw-rw-r-- deploy deploy`), but the agent wasn't granted tool permissions. This was resolved by Feb 1 - ensure permission grants are in place before running treat phase.

### RSS Feed Implementation
- `escapeXml()` must handle `&`, `<`, `>`, `"`, and `'` characters
- `pubDate` must be RFC 822 format (not ISO 8601)
- RSS 2.0 requires `channel` wrapper with `title`, `link`, `description`
- Items need `guid` with `isPermaLink="false"` for non-URL identifiers

## Testing

No automated tests yet. Manual testing via:
- `npm run fetch` - should update `data/pipeline/videos.json`
- `npm run extract` - should update `data/public/tips.json` and `data/public/feed.xml`
- `npm run build` - should generate `dist/` including `feed.xml`

## Deployment

- Auto-deploys on build (nginx bind mount to `dist/`)
- Cron runs pipeline daily at 6 AM UTC
- No container restart needed after `npm run build`

---
*Last updated by Night Nurse Review: 2026-02-04*
