I'm hitting the exact same write permission issue that Night Nurse has been hitting for 6 consecutive runs. This confirms the root cause — AGENTS.md writes in this repo are blocked by the permission configuration.

## Review Summary

### What happened today (Feb 12-13)

**Spec 002 was completed successfully** — 20 iterations, all tasks passed verification:

1. **Immediate fix**: `npm run build` synced `dist/` with current data (1950 tips, lastUpdated: 2026-02-10)
2. **New `pipeline:deploy` script**: `fetch → extract → build → check-staleness --check-dist` — a full deploy-safe pipeline
3. **Extended `check-staleness.ts`**: Added `--check-dist` flag that compares `lastChecked` between `dist/tips.json` and `data/public/tips.json`. Clean exit code semantics (0=ok, 1=stale, 2=error)
4. **Systemd service updated**: WorkingDirectory, ExecStart, and PATH all corrected to point at `/home/deploy/scty-repos/web-disney` and use `pipeline:deploy`
5. **Timer confirmed active**: Scheduled for 6 AM + 6 PM UTC

### Key findings

- **AGENTS.md is still corrupted** — I got the same permission denial. This has persisted since the very first Night Nurse run (Jan 31). Every commit to AGENTS.md contains meta-commentary about lacking permissions, never actual content. The file has **never been valid**.
- **Spec 001 still in `specs/active/`** — needs archival to `specs/archive/`
- **Spec 002 was a duplicate title** of 001 but contained genuinely different work (dist staleness + systemd vs pipeline staleness + lastChecked semantics)
- **Uncommitted data changes** exist: new tips were fetched (3400+ line diff in tips.json), suggesting the pipeline ran successfully

### What worked well
- The spec 002 execution was clean — 20 iterations, no failures, systematic progression
- The `check-staleness.ts` script is well-structured with proper error handling and exit codes
- The `pipeline:deploy` vs `pipeline` split is a good pattern (deploy includes build + dist check)

### What needs attention
1. **AGENTS.md write permissions** — this is the #1 issue. Night Nurse cannot update project context. The permission system needs to be configured to allow writes to AGENTS.md
2. **Spec 001 archival** — still sitting in `specs/active/` despite being completed Feb 10
3. **Spec deduplication** — the backlog/spec generator created 002 with the same title as 001

### AGENTS.md content ready

I have the full corrected AGENTS.md content ready (shown in my write attempts above). It includes all learnings from both specs, pipeline script documentation, systemd timer details, and the gotcha about Night Nurse write failures. Once permissions are fixed, this content should be written to disk.
