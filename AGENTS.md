I don't have write permission. Let me present the updated AGENTS.md content instead.

Here's the updated AGENTS.md:

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

## Recent Completions

### RSS Feed (001) - Completed 2026-02-09
Added RSS 2.0 feed at `data/public/feed.xml` with:
- 50 most recent tips
- XML escaping via `escapeXml()` helper
- RFC 822 date formatting via `formatRfc822Date()` helper
- Channel image, categories, and proper guid elements
- Feed copied to `dist/feed.xml` on build

Frontend integration (Feb 9):
- `<link rel="alternate">` tag in `index.html` `<head>` for RSS autodiscovery
- RSS link with inline SVG icon in footer via `setupFooterRssLink()` in `src/main.ts`
- RSS icon uses CSS `::before` pseudo-element with data URI SVG (orange badge style)

**Note:** Spec 001 is fully complete but still in `specs/active/` — should be moved to `specs/archive/`.

## Gotchas

### Claude Code Permission Grants
Night Nurse initially failed on the RSS feed spec (Jan 31) due to Claude Code permission issues. The filesystem permissions were fine (`-rw-rw-r-- deploy deploy`), but the agent wasn't granted tool permissions. This was resolved by Feb 1 - ensure permission grants are in place before running treat phase.

**Severity of this issue**: The log shows 40+ consecutive failed iterations where the agent kept retrying the same permission-denied operation without stopping or escalating. After that, another 18 iterations hit "Unknown error" before the agent finally succeeded on a fresh attempt. Agents must bail out after 3 failed retries on the same error, not loop 40+ times.

### RSS Feed Implementation
- `escapeXml()` must handle `&`, `<`, `>`, `"`, and `'` characters
- `pubDate` must be RFC 822 format (not ISO 8601)
- RSS 2.0 requires `channel` wrapper with `title`, `link`, `description`
- Items need `guid` with `isPermaLink="false"` for non-URL identifiers

### Spec Lifecycle
- Completed specs should be moved from `specs/active/` to `specs/archive/`
- The log.md can grow enormous with failed iterations (001 log is 380+ lines of mostly failures) — consider truncating or summarizing on completion

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
*Last updated by Night Nurse Review: 2026-02-09*
```

**Summary of changes:**

1. **Updated RSS Feed completion entry** — Changed date to 2026-02-09, added the frontend integration work (today's 4 commits: `<link rel="alternate">` in head, footer RSS link with SVG icon, CSS styling).

2. **Added "Footer elements added dynamically via JS" pattern** — Today's code adds the RSS link via `setupFooterRssLink()` rather than static HTML, which is a pattern worth noting for future footer additions.

3. **Expanded the permission grants gotcha** — The log reveals the agent retried **40+ times** on the same permission-denied error and then hit 18 "Unknown error" iterations before succeeding. This is far worse than the existing note suggested. Added explicit guidance: bail after 3 retries.

4. **Added "Spec Lifecycle" gotcha** — Spec 001 is done but still in `specs/active/`. Noted that specs should be moved to archive and that log.md files can bloat (380+ lines of mostly failure logs).

5. **No changes from AI conversations** — The Orb/Clawdbot sessions were about server setup (mcporter, Sentry, OpenClaw security audit) — unrelated to web-disney project patterns.
