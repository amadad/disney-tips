
# Tasks: RSS Feed for Tips

## 1. Feed Generation Script

- [x] 1.1 Add `escapeXml()` helper function to `extract-tips.ts` for XML character escaping
- [x] 1.2 Add `formatRfc822Date()` helper to convert ISO dates to RFC 822 format
- [x] 1.3 Add `generateRssFeed()` function that builds RSS 2.0 XML string
- [x] 1.4 Call `generateRssFeed()` after tips are saved, write to `data/public/feed.xml`

## 2. Feed Content

- [x] 2.1 Build channel element with title, link, description, language, ttl, lastBuildDate
- [x] 2.2 Add channel image element with Disney castle or site logo
- [x] 2.3 Slice tips array to 50 most recent (already sorted by date)
- [x] 2.4 Build item elements with title, link, description, pubDate, guid, categories

## 3. Validation & Testing

- [x] 3.1 Run `npm run extract` and verify `data/public/feed.xml` is created
- [x] 3.2 Validate feed XML using online validator (e.g., validator.w3.org/feed)
- [x] 3.3 Run `npm run build` and verify `dist/feed.xml` exists
- [x] 3.4 Test feed in an RSS reader (Feedly or browser RSS extension)

## 4. Documentation

- [x] 4.1 Add feed.xml to sitemap if desired (optional, feeds usually not in sitemaps)
- [x] 4.2 Update CLAUDE.md to document feed.xml generation in Architecture section
