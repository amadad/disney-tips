# Priorities

Items listed here will be picked up by Night Nurse (highest first).

## High Priority
- Fix Disney Tips pipeline staleness: ensure `npm run pipeline` refreshes `data/pipeline/*` and `dist/tips.json.lastUpdated` reflects the latest run (not stuck at 2026-02-01). Add a guard that fails the run if `lastUpdated` doesn't advance.
- Add RSS feed for tips (already have /feed.xml in dist, verify correctness + wire into UI + ensure it updates with pipeline).

## Medium Priority
- Add OpenGraph meta tags for social sharing
- Add sitemap.xml for SEO

## Low Priority
- Add dark mode toggle
