---
name: alistigo-ai-m2
status: backlog
created: 2026-06-11T14:20:20Z
updated: 2026-06-11T14:20:20Z
progress: 0%
prd: .claude/prds/alistigo-ai-m2.md
github: (will be set on sync)
---

# Epic: alistigo-ai-m2 — Artifact Playground & Common Architecture

## Overview

M2 extracts the hardwired M1 app into a **reusable platform**: a generic Artifact
Playground that can host any `@alistigo` artifact, a config format system so artifacts
are consistently configurable, and an artifact manager that resolves artifact names to
CDN URLs and boots them.

This milestone introduces three new packages, renames two existing ones, and restructures
the embedded app into a two-page harness that simulates Claude's iframe environment.

## Architecture Decisions

1. **Discriminated union config schema**: `@alistigo/artifact-config-format` aggregates all
   per-artifact schemas using JSON Schema `if/then` on the `app` field. New artifact types
   add their own leaf package as a dependency of this aggregate — not the reverse.

2. **`@alistigo/artifact-manager` is UMD-first**: it must run in the browser without a
   bundler. ESM is exported for tooling. The manager injects `<script>` tags — it does
   not import artifacts as modules.

3. **Claude iframe simulation**: the playground iframe must match Claude's production
   `sandbox`, `referrerpolicy`, `allow`, and `data-no-service-worker` attributes exactly.
   CSP headers are applied via Vite dev server middleware.

4. **Package rename**: `@alistigo/artifact` → `@alistigo/artifact-list`. All references
   in code, ADRs, epics, and GitHub issues must be updated as part of task 001.

## Technical Approach

### New Packages

| Package | Role |
|---------|------|
| `@alistigo/artifact-config-list-format` | Leaf — list config schema + TS types (`readonly` field) |
| `@alistigo/artifact-config-format` | Aggregate — base + discriminated union of all artifact schemas |
| `@alistigo/artifact-manager` | Loader — reads config, validates, resolves CDN URL, injects script |

### Renamed Packages / Apps

| Old | New |
|-----|-----|
| `packages/alistigo-artifact` | `packages/alistigo-artifact-list` |
| `apps/alistigo-list-embedded-app` | `apps/alistigo-artifact-playground` |

### Playground App Structure

```
apps/alistigo-artifact-playground/
  src/
    host/           ← host page (React, dev config form + iframe)
    iframe/         ← iframe page (boots artifact-manager)
  index.html        ← host page entrypoint
  iframe.html       ← iframe page entrypoint
  vite.config.ts    ← multi-page build + CSP middleware
```

### Dev Config Form Controls

Generic (all artifacts):
- Artifact type selector — populated from `@alistigo/artifact-manager` artifact map
- Language selector
- AI chat context (fixed: "claude")
- Reload button
- Clear data button

Dynamic (per artifact type, M2 implements for list):
- `readonly` toggle (list only)

## Implementation Strategy

Tasks are ordered by dependency. Tasks 001 and 002 can start in parallel; all others
wait for their listed prerequisites.

## Task Breakdown Preview

| Task | Title | Parallel | Depends On |
|------|-------|----------|-----------|
| 001  | Rename packages & update all references | No | — |
| 002  | Scaffold `@alistigo/artifact-config-list-format` | Yes | — |
| 003  | Scaffold `@alistigo/artifact-config-format` | No | 002 |
| 004  | Scaffold `@alistigo/artifact-manager` | No | 003 |
| 005  | Rename & restructure app to `alistigo-artifact-playground` | No | 001 |
| 006  | Build host page: Dev Config Form + iframe layout | No | 004, 005 |
| 007  | Implement Claude iframe simulation + CSP headers | No | 006 |
| 008  | Update Gherkin runner to target new iframe page URL | No | 005 |
| 009  | Verify all @m1 scenarios pass end-to-end | No | 007, 008 |
| 010  | Document config-doc / state-doc architecture principle | Yes | — |

## Dependencies

- M1 merged to `main`
- `@alistigo/artifact-list` CDN URL known (from M1 deployment epic)

## Success Criteria (Technical)

- `pnpm build` clean across all renamed and new packages
- `pnpm test` green for all `@m1` Gherkin scenarios via the refactored playground
- Playground boots `@alistigo/artifact-list` from the manager's artifact map
- Toggling `readonly` renders the list without add/delete controls
- Iframe attributes match Claude's production spec exactly
- No remaining references to `@alistigo/artifact` (old name) in source or docs

## Estimated Effort

- Size: L
- Hours: ~20–30

## Tasks Created

- [ ] 001.md - Rename packages & update all references (parallel: false)
- [ ] 002.md - Scaffold @alistigo/artifact-config-list-format (parallel: true)
- [ ] 003.md - Scaffold @alistigo/artifact-config-format (parallel: false)
- [ ] 004.md - Scaffold @alistigo/artifact-manager (parallel: false)
- [ ] 005.md - Rename & restructure app to alistigo-artifact-playground (parallel: false)
- [ ] 006.md - Build host page: Dev Config Form + iframe layout (parallel: false)
- [ ] 007.md - Implement Claude iframe simulation + CSP headers (parallel: false)
- [ ] 008.md - Update Gherkin runner to target new iframe page URL (parallel: false)
- [ ] 009.md - Verify all @m1 scenarios pass end-to-end (parallel: false)
- [ ] 010.md - Document config-doc / state-doc architecture principle (parallel: true)

Total tasks: 10
Parallel tasks: 2 (001+002 can start simultaneously; 010 anytime)
Sequential tasks: 8
Estimated total effort: 22–33 hours
