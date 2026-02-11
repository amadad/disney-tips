
# Proposal: Fix Pipeline Staleness

## Problem

The Disney Tips pipeline has two staleness bugs:

1. **`lastUpdated` lies.** `extract-tips.ts` (line 560) unconditionally sets `lastUpdated: new Date().toISOString()` every run — even when zero new videos are processed. The current value (`2026-02-01`) came from a night-nurse test run, not a real pipeline execution. The last real fetch was January 25.

2. **No staleness detection.** There is no guard to catch when the pipeline runs but produces nothing new, or when `lastUpdated` hasn't advanced. A silent no-op run looks identical to a successful one.

Together these mean the pipeline can silently stall for weeks while `tips.json` reports a recent timestamp.

## Root Cause

In `scripts/extract-tips.ts`, the `TipsData` object is written with `lastUpdated: new Date()` regardless of whether `videosToProcess.length > 0`. The same pattern exists in `fetch-videos.ts` for `videos.json`. Neither script distinguishes "ran and found new content" from "ran and found nothing."

## Scope

### In Scope

- Make `lastUpdated` in `tips.json` reflect when tips *actually changed* (new tips extracted), not when the script last ran
- Add a `lastChecked` timestamp that always advances (so you can tell the pipeline is running)
- Add a post-pipeline staleness guard that fails `npm run pipeline` with a non-zero exit code if `lastUpdated` is older than a configurable threshold (default: 3 days)
- Apply the same fix to `videos.json` in `fetch-videos.ts`

### Out of Scope

- Fixing the systemd timer / cron schedule (separate ops task)
- Adding alerting or notifications (future work, depends on this fix)
- Changing Apify or Gemini integration
- Frontend changes

## Approach

1. **Split timestamps**: Add `lastChecked` (always updates) alongside `lastUpdated` (only updates when content changes). This preserves backwards compatibility — `lastUpdated` keeps its existing meaning but becomes honest.

2. **Conditional `lastUpdated`**: Only advance `lastUpdated` when `newTips.length > 0` (extract) or `newVideos.length > 0` (fetch). Preserve the previous value otherwise.

3. **Staleness guard script**: A new `scripts/check-staleness.ts` that reads `tips.json`, compares `lastUpdated` against `Date.now()`, and exits non-zero if stale. Wire into `npm run pipeline` so CI/cron catches failures.

4. **Update shared types**: Add `lastChecked` to `TipsData` and `VideosData` in `shared/types.ts`.

