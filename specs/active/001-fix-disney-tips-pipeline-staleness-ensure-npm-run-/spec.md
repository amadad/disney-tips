
# Spec: Fix Pipeline Staleness

## Requirements

### R1: Honest `lastUpdated` in `tips.json`

`lastUpdated` must only advance when new tips are actually extracted.

**Given** `tips.json` exists with `lastUpdated: "2026-02-08T06:00:00Z"` and 1831 tips
**When** `npm run extract` runs and finds 0 new videos to process
**Then** `tips.json.lastUpdated` remains `"2026-02-08T06:00:00Z"`
**And** `tips.json.lastChecked` is set to the current timestamp
**And** `tips.json.totalTips` remains 1831

**Given** `tips.json` exists with `lastUpdated: "2026-02-08T06:00:00Z"`
**When** `npm run extract` runs and extracts 5 new tips from 2 new videos
**Then** `tips.json.lastUpdated` advances to the current timestamp
**And** `tips.json.lastChecked` is set to the current timestamp
**And** `tips.json.totalTips` reflects the new deduplicated count

### R2: Honest `lastUpdated` in `videos.json`

Same principle for the fetch stage.

**Given** `videos.json` exists with `lastUpdated: "2026-02-08T06:00:00Z"` and 200 videos
**When** `npm run fetch` runs and finds 0 new videos in RSS feeds
**Then** `videos.json.lastUpdated` remains `"2026-02-08T06:00:00Z"`
**And** `videos.json.lastChecked` is set to the current timestamp
**And** `videos.json.totalVideos` remains 200

**Given** `videos.json` exists with `lastUpdated: "2026-02-08T06:00:00Z"`
**When** `npm run fetch` runs and finds 3 new videos
**Then** `videos.json.lastUpdated` advances to the current timestamp
**And** `videos.json.lastChecked` is set to the current timestamp

### R3: `lastChecked` field on both data files

Both `tips.json` and `videos.json` must include a `lastChecked` ISO timestamp that advances on every pipeline run, regardless of whether new content was found. This lets operators distinguish "pipeline is running but nothing new" from "pipeline is broken."

**Given** the pipeline runs successfully with 0 new content
**Then** `lastChecked` on both files reflects the run time
**And** `lastUpdated` on both files does not change

### R4: Staleness guard

A guard script exits non-zero when `tips.json.lastUpdated` exceeds a staleness threshold.

**Given** `tips.json.lastUpdated` is 2 days ago
**When** `scripts/check-staleness.ts` runs with default threshold (3 days)
**Then** it exits 0 (OK)

**Given** `tips.json.lastUpdated` is 4 days ago
**When** `scripts/check-staleness.ts` runs with default threshold (3 days)
**Then** it exits 1 (STALE)
**And** it prints a message: `STALE: tips.json lastUpdated is <N> days old (threshold: 3 days)`

**Given** `tips.json.lastUpdated` is 4 days ago
**When** `scripts/check-staleness.ts` runs with `--threshold 7`
**Then** it exits 0 (OK, within custom threshold)

### R5: Pipeline script integration

`npm run pipeline` must run the staleness guard after extract completes.

**Given** the pipeline runs and `lastUpdated` is within threshold
**When** the staleness guard runs
**Then** `npm run pipeline` exits 0

**Given** the pipeline runs but `lastUpdated` is beyond threshold
**When** the staleness guard runs
**Then** `npm run pipeline` exits non-zero
**And** the staleness warning is visible in stdout/stderr

### R6: Type updates

`shared/types.ts` must include `lastChecked: string` on both `TipsData` and `VideosData` interfaces.

**Given** the types are updated
**Then** `TipsData` has both `lastUpdated: string` and `lastChecked: string`
**And** `VideosData` has both `lastUpdated: string` and `lastChecked: string`

### R7: Backwards compatibility

The frontend must not break if `lastChecked` is missing (e.g., from a cached `tips.json`).

**Given** `tips.json` lacks `lastChecked` (old format)
**When** the frontend loads
**Then** it renders normally without errors

