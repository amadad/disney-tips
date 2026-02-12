
# Spec: Fix dist/ staleness — build after pipeline

## Requirements

### R1: Pipeline produces a fresh dist/

`npm run pipeline:deploy` must run fetch, extract, build, and check-staleness in sequence. After a successful run, `dist/tips.json` must match `data/public/tips.json`.

**Given** `data/public/tips.json` has `lastChecked: "2026-02-12T06:00:00Z"` after extract
**When** `npm run pipeline:deploy` completes
**Then** `dist/tips.json` has `lastChecked: "2026-02-12T06:00:00Z"`
**And** `dist/tips.json.totalTips` equals `data/public/tips.json.totalTips`

**Given** `npm run pipeline:deploy` runs and extract succeeds
**When** `npm run build` (Vite) fails
**Then** the pipeline exits non-zero
**And** `dist/` is NOT updated (partial build is not deployed)

### R2: Dist-freshness guard

`check-staleness.ts --check-dist` must compare `dist/tips.json.lastChecked` against `data/public/tips.json.lastChecked` and fail if they differ.

**Given** `data/public/tips.json` has `lastChecked: "2026-02-12T06:00:00Z"`
**And** `dist/tips.json` has `lastChecked: "2026-02-12T06:00:00Z"`
**When** `npm run check-staleness -- --check-dist` runs
**Then** it exits 0
**And** it prints `OK: dist/tips.json matches data/public/tips.json (lastChecked: ...)`

**Given** `data/public/tips.json` has `lastChecked: "2026-02-12T06:00:00Z"`
**And** `dist/tips.json` has `lastChecked: "2026-02-10T04:23:36Z"` (older)
**When** `npm run check-staleness -- --check-dist` runs
**Then** it exits 1
**And** it prints `STALE: dist/tips.json lastChecked (...) does not match data/public/tips.json lastChecked (...). Run npm run build.`

**Given** `dist/tips.json` does not exist
**When** `npm run check-staleness -- --check-dist` runs
**Then** it exits 2
**And** it prints `Failed to read dist/tips.json`

### R3: Existing staleness check unchanged

The existing `--threshold` check on `data/public/tips.json` must continue to work exactly as before. `--check-dist` is additive.

**Given** `tips.json.lastUpdated` is 2 days old
**When** `npm run check-staleness` runs (no --check-dist)
**Then** it exits 0 (same as spec 001 R4)

### R4: `pipeline:deploy` script in package.json

**Given** `package.json` is updated
**Then** `scripts.pipeline:deploy` equals `npm run fetch && npm run extract && npm run build && npm run check-staleness -- --check-dist`
**And** `scripts.pipeline` is unchanged (`npm run fetch && npm run extract && npm run check-staleness`)

### R5: Automation uses correct path and script

The systemd service (`disney-tips-pipeline.service`) must:
- Set `WorkingDirectory=/home/deploy/scty-repos/web-disney`
- Run `npm run pipeline:deploy` (not `pipeline`)
- Source Node.js properly (via nvm or direct path)

**Given** the systemd timer fires
**When** the service unit runs
**Then** it executes `npm run pipeline:deploy` in `/home/deploy/scty-repos/web-disney`
**And** the pipeline log is visible via `journalctl --user -u disney-tips-pipeline`

### R6: Immediate fix

`npm run build` must be run once during this spec's implementation to sync `dist/` with the current `data/public/` output.

**Given** `dist/tips.json` currently has `lastUpdated: 2026-02-01` with 1831 tips
**When** `npm run build` is run
**Then** `dist/tips.json` has `lastUpdated: 2026-02-10` with 1950 tips
**And** the live site at disney.bound.tips serves the updated data (no container restart needed due to bind mount)

