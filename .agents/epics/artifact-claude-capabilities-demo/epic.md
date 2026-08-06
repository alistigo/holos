---
name: artifact-claude-capabilities-demo
status: in-progress
created: 2026-08-06T20:14:46Z
updated: 2026-08-06T20:14:46Z
progress: 0%
prd: .claude/prds/artifact-claude-capabilities-demo.md
github: https://github.com/alistigo/holos/issues/68
---

# Epic: artifact-claude-capabilities-demo

## Overview

Expand `@alistigo/artifact-storage-explorer` into `@alistigo/artifact-claude-capabilities-demo` — a comprehensive tabbed showcase of every API Claude injects into artifact iframes. Ships as a renamed npm UMD bundle with an updated skill package.

**Supersedes**: epic `claude-storage-explorer` (tasks 001–004 completed, task 005 LinkedIn skipped).

## Architecture Decisions

**5 tabs, one artifact** — Storage (existing `StorageExplorerApp`), AI (`window.claude.complete`), File Generation (`URL.createObjectURL`), API Calls (`window.fetch` proxy), External Navigation (`<a>` + `window.open`). Tab navigation built with Tailwind, no extra UI library.

**Draft overlay scoped to Storage tab** — Other tabs work normally in draft mode; only `window.storage` has draft restrictions. The `DraftBadge` stays in `ArtifactContextMenuContainer` for awareness.

**Package rename, not new package** — same directory structure, same build pipeline (Vite UMD + CSS injection). Package name changes from `artifact-storage-explorer` to `artifact-claude-capabilities-demo`.

**npm deprecation (not deletion)** — Old packages marked deprecated with a forwarding message; they remain downloadable for anyone who pinned them.

## Technical Approach

### Renamed packages

- `packages/artifact-storage-explorer/` → `packages/artifact-claude-capabilities-demo/`
- `packages/artifact-storage-explorer-skill/` → `packages/artifact-claude-capabilities-demo-skill/`

### New file structure

```
packages/artifact-claude-capabilities-demo/src/
├── App.tsx
├── Tabs.tsx                    (tab bar component)
├── auto-mount.tsx
├── index.tsx
├── tabs/
│   ├── StorageTab.tsx
│   ├── AiTab.tsx
│   ├── FileGenerationTab.tsx
│   ├── ApiCallsTab.tsx
│   └── ExternalNavigationTab.tsx
└── styles/app.css
```

### Reused packages

- `@alistigo/explorer-components-react` — `StorageExplorerApp` in StorageTab (unchanged)
- `@alistigo/artifact-core` — `useArtifactLifecycle`, `useStartArtifact`
- `@alistigo/artifact-core-components-react` — `ArtifactContextMenuContainer`, `Modal`, `LoadingScreen`, `ErrorScreen`
- `@alistigo/claude-artifact-api` — `artifactContext()` for draft detection
- `@alistigo/claude-storage-plugin` — storage availability check on startup (Storage tab only)

## Implementation Strategy

1. **T001** — Rename packages + all references (foundation)
2. **T003** — Tab navigation shell + Storage tab (depends on T001)
3. **T004**, **T005**, **T006**, **T007** — Individual tabs (parallel, depend on T003)
4. **T008**, **T009** — Skill update + playground update (parallel with T003)
5. **T002** — Deprecate old npm (manual, post-publish)
6. **T010** — LinkedIn post (last)

## Tasks Created

- [ ] 001.md - Rename packages + update all references (parallel: false)
- [ ] 002.md - Deprecate old npm packages — manual post-publish step (parallel: true)
- [ ] 003.md - Tab navigation shell + wire Storage tab (parallel: false)
- [ ] 004.md - AI tab — window.claude.complete (parallel: true)
- [ ] 005.md - File Generation tab — URL.createObjectURL download (parallel: true)
- [ ] 006.md - API Calls tab — window.fetch proxy (parallel: true)
- [ ] 007.md - External Navigation tab — links + window.open (parallel: true)
- [ ] 008.md - Update skill package SKILL.md + README (parallel: true)
- [ ] 009.md - Update playground registry (parallel: true)
- [ ] 010.md - LinkedIn post draft (parallel: false)

Total tasks: 10
Parallel tasks: 7 (002, 004, 005, 006, 007, 008, 009)
Sequential tasks: 3 (001 → 003 → 010)
Estimated total effort: 14–18 hours
