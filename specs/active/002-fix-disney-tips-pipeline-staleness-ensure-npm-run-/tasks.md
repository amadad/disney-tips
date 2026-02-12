
# Tasks: Fix dist/ staleness — build after pipeline

## 1. Immediate fix: rebuild dist/

- [x] 1.1 Run `npm run build` to sync `dist/` with current `data/public/` output
- [x] 1.2 Verify `dist/tips.json` now has `lastUpdated: 2026-02-10` and 1950 tips
- [x] 1.3 Verify disney.bound.tips serves the updated tips count (curl or browser check)

## 2. Add `pipeline:deploy` script

- [x] 2.1 Add `"pipeline:deploy": "npm run fetch && npm run extract && npm run build && npm run check-staleness -- --check-dist"` to `package.json`

## 3. Extend check-staleness with --check-dist

- [x] 3.1 Add `--check-dist` flag parsing to `check-staleness.ts`
- [x] 3.2 When `--check-dist` is set, read both `dist/tips.json` and `data/public/tips.json`
- [x] 3.3 Compare `lastChecked` fields — exit 0 if they match, exit 1 if they differ
- [x] 3.4 Print descriptive OK/STALE messages including both timestamps
- [x] 3.5 Exit 2 if either file is missing or unparseable
- [x] 3.6 When `--check-dist` is NOT set, behavior is unchanged (existing threshold check only)

## 4. Fix systemd timer/service

- [x] 4.1 Read current `disney-tips-pipeline.service` unit file
- [ ] 4.2 Update `WorkingDirectory` to `/home/deploy/scty-repos/web-disney`
- [ ] 4.3 Update `ExecStart` to run `npm run pipeline:deploy`
- [ ] 4.4 Ensure Node.js is available in the service environment (PATH or nvm source)
- [ ] 4.5 Reload systemd daemon and enable+start the timer
- [ ] 4.6 Verify timer is active: `systemctl --user status disney-tips-pipeline.timer`

## 5. Verify end-to-end

- [ ] 5.1 Run `npm run check-staleness -- --check-dist` — confirm it passes (dist matches source)
- [ ] 5.2 Run `npm run check-staleness` (without --check-dist) — confirm existing behavior unchanged
- [ ] 5.3 Confirm `npm run pipeline:deploy` script definition is correct in package.json
- [ ] 5.4 Confirm timer is scheduled for next fire time
