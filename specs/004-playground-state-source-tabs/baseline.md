# End-to-End Baseline (recorded before any source change)

**Date**: 2026-11-19 · **Branch**: `feat/004-playground-state-source-tabs` ·
**Playground**: `pnpm nx run alistigo-artifact-playground:build` then `vite preview` (started by each
`test:e2e` target)

Recorded per task T001, so that a failure after the change can be told apart from one that was
already there. FR-019 and SC-005 are measured against these numbers.

| Suite | Command | Scenarios | Steps | Excluded |
|---|---|---|---|---|
| `list-features` | `pnpm nx run artifact-list:test:e2e` | **21 passed / 21** | 83 passed / 83 | 3 `@todo` |
| `artifact-ai-draw-comments-features` | `pnpm nx run artifact-ai-draw-comments:test:e2e` | **13 passed / 13** | 60 passed / 60 | 1 `@todo` |

Totals: **34 scenarios, 143 steps, 0 failures.**

Raw output: `/tmp/004-list-e2e-before.txt`, `/tmp/004-draw-e2e-before.txt` (scratch; the numbers
above are the durable record).

## After the change

Filled in at T037.

| Suite | Scenarios | Steps | Verdict |
|---|---|---|---|
| `list-features` | 21 passed / 21 | 83 passed / 83 | ✅ matches baseline |
| `artifact-ai-draw-comments-features` | 13 passed / 13 | 60 passed / 60 | ✅ matches baseline |
