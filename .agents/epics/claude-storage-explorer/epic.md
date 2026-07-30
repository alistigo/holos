---
name: claude-storage-explorer
status: in-progress
created: 2026-07-30T00:00:00Z
updated: 2026-07-30T00:00:00Z
progress: 0%
prd: .claude/prds/claude-storage-explorer.md
---

# Epic: claude-storage-explorer

## Overview

Build `@alistigo/artifact-storage-explorer` — a standalone Claude artifact that lets developers inspect, browse, and delete entries from `window.storage` (the storage API that Claude injects into every artifact iframe via the bridge script). Ships as an npm UMD bundle so any developer can paste one script tag into a conversation and immediately see the storage state.

Deliverables: `explorer-components-react` component library with Storybook, `artifact-storage-explorer` UMD bundle, `artifact-storage-explorer-skill` npm package, registry entry in `artifact-manager`, and a LinkedIn post draft.

## Architecture Decisions

**No plugin system for this artifact** — `artifact-storage-explorer` calls `window.storage` directly. It's explicitly a storage inspector; wrapping that in a plugin abstraction would add indirection with no benefit.

**`list()` returns values, no separate `get` needed** — `window.storage.list(prefix, shared?)` returns `Record<string, unknown>` with both keys and values. The viewer uses data already in memory when a key is clicked; only delete + reload requires a new network call.

**Separate `explorer-components-react` library** — components (`KeyList`, `JsonDocumentViewer`, `StorageSection`, `StorageExplorerApp`) are extracted into a publishable library with its own Storybook so they can be reused or extended independently of the artifact bundle.

**CSS injected into UMD** — same as `artifact-list`, using `vite-plugin-css-injected-by-js` so the bundle is truly self-contained.

**No i18n** — developer tool, English only for v1.

## Technical Approach

### `packages/explorer-components-react`

- `KeyList` — scrollable key list with loading skeleton
- `JsonDocumentViewer` — `@uiw/react-json-view` + delete button with spinner
- `StorageSection` — composes KeyList + JsonDocumentViewer for one storage namespace
- `StorageExplorerApp` — top-level component: prefix input, refresh, two StorageSections
- Own `.storybook/` with stories for all four components including loading/empty/deleting states
- Builds as ES module library (React as peer dep)

### `packages/artifact-storage-explorer`

- Vite UMD bundle (same config as `artifact-list`)
- Auto-mounts from `#alistigo-config` JSON; reads `prefix` field
- CSS injected via `vite-plugin-css-injected-by-js`
- Imports `StorageExplorerApp` from `explorer-components-react`

### `packages/artifact-storage-explorer-skill`

- `SKILL.md` with triggers and config field docs
- Markdown-only package (no code)

### Registry + Playground

- New entry in `packages/artifact-manager/src/registry.ts`
- `KNOWN_APPS` in the playground picks it up automatically

## Implementation Strategy

1. **T001** — `explorer-components-react` (foundation)
2. **T002** — `artifact-storage-explorer` (depends on T001)
3. **T003** — `artifact-storage-explorer-skill` (parallel with T002)
4. **T004** — Registry + playground wiring (depends on T002, T003)
5. **T005** — LinkedIn post draft (parallel, independent)

## Tasks Created

- [x] 001.md - Create explorer-components-react library + Storybook
- [x] 002.md - Create artifact-storage-explorer UMD bundle
- [x] 003.md - Create artifact-storage-explorer-skill package
- [x] 004.md - Add to artifact registry + verify playground
- [ ] 005.md - LinkedIn post draft + ideas.md update

Total tasks: 5
Parallel tasks: 2 (003, 005)
Sequential tasks: 3 (001 → 002 → 004)
Estimated total effort: 6–8 hours
