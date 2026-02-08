
```markdown
# Proposal: RSS Feed Discovery & Frontend Integration

## Why

The RSS feed at `/feed.xml` is generated and served, but visitors have no way to discover it. Without a `<link rel="alternate">` tag, feed readers can't auto-detect the feed. Without a visible link, users don't know it exists. This follow-up closes those gaps.

## Scope

### In Scope

- Add `<link rel="alternate" type="application/rss+xml">` to `index.html` `<head>` for auto-discovery
- Add a visible RSS icon/link in the site footer pointing to `/feed.xml`

### Out of Scope

- Feed generation changes (already working in `extract-tips.ts`)
- Feed format changes (RSS 2.0 is sufficient)
- Per-category or per-park filtered feeds
- Email subscription / newsletter integration
- Feed analytics or subscriber tracking

## Approach

1. **Auto-discovery**: Add a single `<link>` tag in `index.html` `<head>` — standard pattern all feed readers recognize
2. **Visible link**: Add an RSS link to the existing footer section in `src/main.ts` with an SVG RSS icon
3. **No new dependencies**: Pure HTML/CSS additions, no libraries needed

## Prior Work

Spec `001` delivered the feed generation pipeline (completed 2026-02-01). This spec covers only the frontend discovery layer.
```

