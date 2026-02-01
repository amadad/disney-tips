I need permission to write to AGENTS.md. Here's the updated content I would write:

---

**Summary of today's work:**

Night Nurse attempted to implement an RSS feed feature (spec 001) but failed after 25 iterations due to Claude Code permission issues - not filesystem permissions. The `scripts/extract-tips.ts` file has proper `rw` permissions for the deploy user, but the agent wasn't granted write access.

**Proposed AGENTS.md update:**

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

## Gotchas

### Night Nurse Permission Issues (2026-01-31)
Night Nurse got stuck for 25 iterations trying to edit `scripts/extract-tips.ts` with "Permission denied" errors. The file permissions were fine (`-rw-rw-r-- deploy deploy`) - this was a Claude Code permission grant issue, not a filesystem issue. Ensure Night Nurse has explicit permission grants for `scripts/` directory before running treat phase.

## Testing

No automated tests yet. Manual testing via:
- `npm run fetch` - should update `data/pipeline/videos.json`
- `npm run extract` - should update `data/public/tips.json`
- `npm run build` - should generate `dist/`

## Deployment

- Auto-deploys on build (nginx bind mount to `dist/`)
- Cron runs pipeline daily at 6 AM UTC
- No container restart needed after `npm run build`

---
*Last updated by Night Nurse: 2026-01-31*
```

**Key learning to action:** The Night Nurse config needs to pre-grant write permissions to `scripts/` directory before the treat phase can successfully implement features.
