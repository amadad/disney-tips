
# Tasks: Fix Pipeline Staleness

## 1. Update shared types

- [x] 1.1 Add `lastChecked: string` to `TipsData` in `shared/types.ts`
- [x] 1.2 Add `lastChecked: string` to `VideosData` in `shared/types.ts`

## 2. Fix `extract-tips.ts` — conditional `lastUpdated`

- [x] 2.1 Load previous `lastUpdated` from existing `tips.json` before processing
- [x] 2.2 Only set `lastUpdated` to `new Date().toISOString()` when `newTips.length > 0`; otherwise preserve the previous value
- [x] 2.3 Always set `lastChecked` to `new Date().toISOString()`
- [x] 2.4 Log whether `lastUpdated` advanced or was preserved

## 3. Fix `fetch-videos.ts` — conditional `lastUpdated`

- [x] 3.1 Load previous `lastUpdated` from existing `videos.json` before processing
- [x] 3.2 Only set `lastUpdated` to `new Date().toISOString()` when `newVideos.length > 0`; otherwise preserve the previous value
- [x] 3.3 Always set `lastChecked` to `new Date().toISOString()`
- [x] 3.4 Log whether `lastUpdated` advanced or was preserved

## 4. Create staleness guard script

- [x] 4.1 Create `scripts/check-staleness.ts`
- [x] 4.2 Read `data/public/tips.json` and parse `lastUpdated`
- [x] 4.3 Accept `--threshold <days>` flag (default: 3)
- [x] 4.4 Compare `lastUpdated` age against threshold
- [x] 4.5 Exit 0 if fresh, exit 1 if stale with descriptive message
- [x] 4.6 Add `"check-staleness"` script to `package.json`

## 5. Wire guard into pipeline

- [x] 5.1 Update `package.json` `"pipeline"` script to: `npm run fetch && npm run extract && npm run check-staleness`

## 6. Verify

- [ ] 6.1 Run `npm run build` — confirm it succeeds
- [ ] 6.2 Run `npm run check-staleness` — confirm it reports current staleness status
- [ ] 6.3 Verify `tips.json` and `videos.json` both have `lastChecked` field after next pipeline run

---

Key findings from the investigation:

- **The real last fetch was Jan 25** (`videos.json.lastUpdated: 2026-01-25T05:31:05Z`). The Feb 1 timestamp in `tips.json` came from a night-nurse test run of `npm run extract` that re-processed existing data.
- **`extract-tips.ts:560`** is the primary offender — unconditional `lastUpdated: new Date().toISOString()`.
- **`fetch-videos.ts:232`** has the same pattern for `videos.json`.
- The fix is ~4 files touched: `shared/types.ts`, `extract-tips.ts`, `fetch-videos.ts`, and a new `check-staleness.ts`. Minimal blast radius.

Want me to write these files to disk once permissions are granted, or would you prefer to save them yourself?
