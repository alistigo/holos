# Baseline: `artifact-list:test:e2e` before this feature

**Recorded**: 2026-11-17 (task T001)
**Branch**: `feat/003-draw-comments-e2e-harness`, at the point before any file was changed
**Command**: `pnpm nx run artifact-list:test:e2e`

```text
21 scenarios (21 passed)
83 steps (83 passed)
0m35.928s
```

| Metric | Value |
|---|---|
| Scenarios | **21**, all passing |
| Steps | **83**, all passing |
| Wall clock | ~36 s (executing steps) |

## Why this file exists

This is the acceptance threshold for **SC-006** ("All list-artifact scenarios that passed
before the harness move still pass after it, with the same count of passing scenarios") and
the only way to attribute a later list failure correctly.

Two separate changes in this feature can move this number, and they must not be confused:

1. **The harness move (US3)** — a regression here means the extracted World, hooks, page
   object or routes are wrong. Checked at task T021, *before* the bundle route exists.
2. **The bundle route (research F1)** — from T011 onward the preview serves the local
   `dist/` build instead of the published `@alistigo/artifact-list@0` from jsDelivr. A drop
   that appears only at T061 and not at T021 is a pre-existing `artifact-list` regression
   that the published bundle was masking, not a harness fault.

**Do not rebase this baseline.** If the count legitimately changes, record why underneath
rather than overwriting the numbers above.
