# Log: Fix Disney Tips pipeline staleness: ensure `npm run pipeline` refreshes `data/pipeline/*` and `dist/tips.json.lastUpdated` reflects the latest run (not stuck at 2026-02-01). Add a guard that fails the run if `lastUpdated` doesn't advance.

## 2026-02-12
- Spec generated from backlog

### Iteration 1 - 04:04:17
Task: 1.1 Run `npm run build` to sync `dist/` with current `data/public/` output
Result: ✓ Complete

### Iteration 2 - 04:04:25
Task: 1.2 Verify `dist/tips.json` now has `lastUpdated: 2026-02-10` and 1950 tips
Result: ✓ Complete

### Iteration 3 - 04:04:36
Task: 1.3 Verify disney.bound.tips serves the updated tips count (curl or browser check)
Result: ✓ Complete

### Iteration 4 - 04:04:48
Task: 2.1 Add `"pipeline:deploy": "npm run fetch && npm run extract && npm run build && npm run check-staleness -- --check-dist"` to `package.json`
Result: ✓ Complete

### Iteration 5 - 04:05:15
Task: 3.1 Add `--check-dist` flag parsing to `check-staleness.ts`
Result: ✓ Complete

### Iteration 6 - 04:05:50
Task: 3.2 When `--check-dist` is set, read both `dist/tips.json` and `data/public/tips.json`
Result: ✓ Complete
