
# Spec: RSS Feed for Tips

## Overview

Generate a valid RSS 2.0 feed at `/feed.xml` containing the most recent Disney tips.

## Requirements

### R1: Feed Generation

**Given** the pipeline runs successfully  
**When** tips are extracted and saved to `tips.json`  
**Then** a `feed.xml` file is generated in `data/public/`

### R2: Feed Structure

**Given** the feed is generated  
**When** a user accesses `/feed.xml`  
**Then** the response is valid RSS 2.0 XML with:
- `<?xml version="1.0" encoding="UTF-8"?>` declaration
- `<rss version="2.0">` root element
- Required channel elements: `<title>`, `<link>`, `<description>`, `<lastBuildDate>`
- Optional channel elements: `<language>`, `<ttl>`, `<image>`

### R3: Feed Items

**Given** tips exist in `tips.json`  
**When** the feed is generated  
**Then** each item contains:
- `<title>` - Tip text (truncated to 100 chars if needed)
- `<link>` - YouTube video URL (source video)
- `<description>` - Full tip text with source channel attribution
- `<pubDate>` - RFC 822 formatted date from `source.publishedAt`
- `<guid isPermaLink="false">` - Tip UUID
- `<category>` elements for: category label, park label, priority

### R4: Feed Limits

**Given** more than 50 tips exist  
**When** the feed is generated  
**Then** only the 50 most recent tips are included (sorted by `source.publishedAt` descending)

### R5: XML Escaping

**Given** tip text contains special characters (`<`, `>`, `&`, `"`, `'`)  
**When** the feed is generated  
**Then** characters are properly XML-escaped in all text content

### R6: Channel Metadata

**Given** the feed is generated  
**Then** channel metadata includes:
- Title: "Disney Tips - bound.tips"
- Link: "https://disney.bound.tips"
- Description: "Daily Disney tips extracted from top YouTube channels"
- Language: "en-us"
- TTL: 1440 (24 hours in minutes)

### R7: Build Integration

**Given** `npm run build` is executed  
**When** Vite builds the site  
**Then** `feed.xml` is copied to `dist/feed.xml` via publicDir

