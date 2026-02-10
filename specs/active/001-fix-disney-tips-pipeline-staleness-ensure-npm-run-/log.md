# Log: Fix Disney Tips pipeline staleness: ensure `npm run pipeline` refreshes `data/pipeline/*` and `dist/tips.json.lastUpdated` reflects the latest run (not stuck at 2026-02-01). Add a guard that fails the run if `lastUpdated` doesn't advance.

## 2026-02-10
- Spec generated from backlog

### Iteration 1 - 04:06:03
Task: 1.1 Add `lastChecked: string` to `TipsData` in `shared/types.ts`
Result: ✓ Complete

### Iteration 2 - 04:06:22
Task: 1.2 Add `lastChecked: string` to `VideosData` in `shared/types.ts`
Result: ✓ Complete

### Iteration 3 - 04:07:12
Task: 2.1 Load previous `lastUpdated` from existing `tips.json` before processing
Result: ✓ Complete

### Iteration 4 - 04:08:08
Task: 2.2 Only set `lastUpdated` to `new Date().toISOString()` when `newTips.length > 0`; otherwise preserve the previous value
Result: ✓ Complete

### Iteration 5 - 04:09:05
Task: 2.3 Always set `lastChecked` to `new Date().toISOString()`
Result: ✓ Complete

### Iteration 6 - 04:09:44
Task: 2.4 Log whether `lastUpdated` advanced or was preserved
Result: ✓ Complete

### Iteration 7 - 04:10:35
Task: 3.1 Load previous `lastUpdated` from existing `videos.json` before processing
Result: ✓ Complete

### Iteration 8 - 04:11:08
Task: 3.2 Only set `lastUpdated` to `new Date().toISOString()` when `newVideos.length > 0`; otherwise preserve the previous value
Result: ✓ Complete

### Iteration 9 - 04:12:50
Task: 3.3 Always set `lastChecked` to `new Date().toISOString()`
Result: ✓ Complete

### Iteration 10 - 04:13:22
Task: 3.4 Log whether `lastUpdated` advanced or was preserved
Result: ✓ Complete
