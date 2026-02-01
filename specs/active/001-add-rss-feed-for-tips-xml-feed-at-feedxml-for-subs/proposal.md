
# Proposal: RSS Feed for Tips

## Why

Disney tips subscribers want to stay updated on new tips without manually checking the website. An RSS feed enables:
- **Subscription via RSS readers** (Feedly, Inoreader, etc.)
- **Integration with automation tools** (Zapier, IFTTT, Make)
- **Podcast app compatibility** for audio-first users
- **SEO benefits** via feed aggregators and directories

## Scope

### In Scope
- Generate `/feed.xml` at build time from `tips.json`
- Include most recent tips (limit to last 50 to keep feed size reasonable)
- Standard RSS 2.0 format with required elements
- Tip metadata in feed items (category, park, priority as categories)
- Link back to main site and source video
- Auto-regenerate during pipeline build

### Out of Scope
- Atom feed format (RSS 2.0 is sufficient for most readers)
- Per-category feeds (can add later if demand exists)
- Email subscription/newsletter integration
- Feed customization UI
- Analytics/tracking in feed

## Approach

1. **Add feed generation to extract-tips.ts** - Generate `feed.xml` alongside `sitemap.xml` and `health.json` during the pipeline
2. **RSS 2.0 format** - Most widely supported, includes `<channel>` and `<item>` elements
3. **Static generation** - No runtime RSS generation needed; rebuild daily via cron
4. **Vite passthrough** - `feed.xml` in `data/public/` auto-copied to `dist/` via existing `publicDir` config

