# Disney Parks Tips

Curated Disney World & Disneyland tips extracted from expert YouTube channels using AI.

## How It Works

1. **Daily pipeline** fetches new videos from 10 Disney YouTube channels (via RSS, no API key)
2. **Gemini Flash Lite** extracts actionable tips from video transcripts
3. **Static frontend** displays searchable, filterable tips with deep linking

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (or export GEMINI_API_KEY directly)
export GEMINI_API_KEY=your_key_here

# Run the pipeline (fetches videos + extracts tips)
npm run pipeline

# Start the frontend
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) - Only key needed |
| `GEMINI_MODEL` | Optional: override model (default: `gemini-2.5-flash-lite`) |

## Project Structure

```
shared/
  types.ts            # Shared types for pipeline and frontend

scripts/              # Data pipeline
  fetch-videos.ts       # RSS feed + transcript extraction
  extract-tips.ts       # Gemini-powered tip extraction

data/
  pipeline/           # NOT deployed (repo-only)
    videos.json         # Video metadata + transcripts
    processed-videos.json  # Ledger of processed videos
  public/             # Deployed to production
    tips.json           # Extracted tips

src/                  # Frontend
  main.ts               # Vanilla TypeScript app
  types.ts              # Re-exports from shared/types.ts
  styles.css            # Styling
```

## Tip Categories

- **Parks** - Park-specific strategies and tips
- **Dining** - Restaurant and food recommendations
- **Hotels** - Resort and accommodation tips
- **Budget** - Money-saving tips
- **Planning** - Trip planning advice
- **Transportation** - Getting around Disney

## YouTube Channels

- AllEars.net
- DFBGuide
- PixieDustedMom
- MillennialOnMainStreet
- DisneyInDetail
- TheTimTracker
- MickeyViews
- ResortTV1
- PagingMrMorrow
- TPMvids

## Deployment

Deployed to GitHub Pages at https://amadad.github.io/disney-tips/

```bash
npm run build
# Deploy contents of dist/
```

GitHub Actions runs the pipeline daily (6 AM UTC) and auto-deploys on changes.

## License

MIT
