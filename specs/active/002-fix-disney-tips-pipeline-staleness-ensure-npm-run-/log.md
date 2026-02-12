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

### Iteration 7 - 04:06:24
Task: 3.3 Compare `lastChecked` fields — exit 0 if they match, exit 1 if they differ
Result: ✓ Complete

### Iteration 8 - 04:06:44
Task: 3.4 Print descriptive OK/STALE messages including both timestamps
Result: ✓ Complete

### Iteration 9 - 04:07:38
Task: 3.5 Exit 2 if either file is missing or unparseable
Result: ✓ Complete

### Iteration 10 - 04:08:09
Task: 3.6 When `--check-dist` is NOT set, behavior is unchanged (existing threshold check only)
Result: ✓ Complete

### Iteration 11 - 04:08:24
Task: 4.1 Read current `disney-tips-pipeline.service` unit file
Result: ✓ Complete

### Iteration 12 - 04:08:55
Task: 4.2 Update `WorkingDirectory` to `/home/deploy/scty-repos/web-disney`
Result: ✓ Complete

### Iteration 13 - 04:09:22
Task: 4.3 Update `ExecStart` to run `npm run pipeline:deploy`
Result: ✓ Complete

### Iteration 14 - 04:10:09
Task: 4.4 Ensure Node.js is available in the service environment (PATH or nvm source)
Result: ✓ Complete

### Iteration 15 - 04:10:18
Task: 4.5 Reload systemd daemon and enable+start the timer
Result: ✓ Complete

### Iteration 16 - 04:10:25
Task: 4.6 Verify timer is active: `systemctl --user status disney-tips-pipeline.timer`
Result: ✓ Complete

### Iteration 17 - 04:10:32
Task: 5.1 Run `npm run check-staleness -- --check-dist` — confirm it passes (dist matches source)
Result: ✓ Complete

### Iteration 18 - 04:10:41
Task: 5.2 Run `npm run check-staleness` (without --check-dist) — confirm existing behavior unchanged
Result: ✓ Complete

### Iteration 19 - 04:10:49
Task: 5.3 Confirm `npm run pipeline:deploy` script definition is correct in package.json
Result: ✓ Complete
