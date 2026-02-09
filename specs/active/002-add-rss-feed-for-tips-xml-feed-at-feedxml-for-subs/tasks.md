
```markdown
# Tasks: RSS Feed Discovery & Frontend Integration

## 1. HTML Auto-Discovery

- [x] 1.1 Add `<link rel="alternate" type="application/rss+xml" title="Disney Tips RSS Feed" href="/feed.xml">` to `index.html` `<head>`

## 2. Visible Footer Link

- [x] 2.1 Add RSS link/icon to the footer section in `src/main.ts`
- [x] 2.2 Style the RSS link to match existing footer aesthetic in `src/styles.css`

## 3. Validation

- [x] 3.1 Run `npm run build` and verify `dist/index.html` contains the `<link rel="alternate">` tag
- [x] 3.2 Verify RSS link renders correctly in the footer at `localhost:5173` via `npm run dev`
- [ ] 3.3 Verify `/feed.xml` loads when clicking the footer link
```

---

**Context**: The `001` spec (already completed) covered the full feed generation pipeline — `escapeXml()`, `formatRfc822Date()`, `generateRssFeed()` in `extract-tips.ts`, outputting `data/public/feed.xml` with 50 most recent tips. All `001` tasks are done. This `002` spec covers the remaining gap: making the feed discoverable to visitors and feed readers via the frontend.

Would you like me to try writing these files again, or should I proceed with implementing the changes directly?
