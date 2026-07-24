---
name: storage-as-plugin
status: in-progress
created: 2026-07-24T11:45:10Z
updated: 2026-07-24T11:45:10Z
progress: 0%
prd: .claude/prds/storage-as-plugin.md
github: https://github.com/alistigo/holos/issues/31
---

# Epic: storage-as-plugin

## Overview

Refactor the two storage backends (`alistigo-local-storage-repository`, `alistigo-claude-artifact-list-storage`) into first-class CDN-loaded plugins that follow the composable plugin system (ADR 0016). Introduce a `type` field on `AlistigoPlugin`, rename both packages to the `*-plugin` convention, remove hardcoded storage selection from `App.tsx`, and upgrade the playground storage tab to show both storages simultaneously.

## Architecture Decisions

**Storage plugins use CDN loading** — same jsDelivr `@0` pattern as Sentry/PostHog. This is consistent with ADR 0016 R4 (plugins ship independently-versioned, never bundled into the artifact).

**Plugin type system** — `type?: "monitoring" | "storage" | (string & {})` added to `AlistigoPlugin`. Informational metadata enabling type-based queries. Not enforced by the runtime.

**Storage extension** — `storage?: AlistigoStorageExtension` added to `AlistigoPlugin`. Contains `isAvailable()`, `createStore()`, `listKeys()`, and optional `seedIfEmpty()`.

**Default injection** — `mount()` injects both storage plugins at the front of the plugin spec (claude first = preferred, local second = fallback). User-specified plugins come after.

**Priority** — determined by insertion order. First storage plugin with `isAvailable() === true` wins.

**In-memory fallback** — if no storage plugin is available or loads from CDN, the artifact uses a Map-based in-memory store. No error thrown; list state is not persisted.

**Playground** — host imports `@alistigo/local-storage-plugin` directly (workspace:*) for `listKeys()`. Claude storage continues via `useClaudeStorageSimulator`. StorageExplorer always renders two labelled sections.

## Technical Approach

### Plugin API Package
Add `PluginType`, `AlistigoStorageExtension` to `packages/alistigo-artifact-plugin-api/src/types.ts`. Export from index. Add peer deps for `@alistigo/document-editor` and `@alistigo/document-format` (type-only usage).

### Storage Plugin Packages
Rename directories and npm names. Add `src/local-storage-plugin.ts` and `src/claude-storage-plugin.ts` implementing `AlistigoPlugin`. Add same self-contained ESM vite build pattern (`vite.config.ts` with `formats: ["es"]`, all deps inlined). Export plugin as default, keep repository class as named export for backwards compat.

### Artifact-List Host
Add `InMemoryListStore` fallback. Update `plugins.ts` to inject default storage spec. Update `mount.ts` to resolve active store after plugin loading. Update `App.tsx` to accept `repository` as prop. Remove all direct storage package imports from `App.tsx`.

### Playground
Add `useLocalStorageEntries` hook using `storage` window event + `localStoragePlugin.storage.listKeys()`. Update `StorageExplorer` with two always-visible sections. Wire through `HostPage` → `HostForm`.

### ADR
Write `docs/adrs/0017-storage-plugin-system.md` documenting type system and storage extension.

## Implementation Strategy

Sequenced:
1. **T1** (plugin API) — foundation, must be first
2. **T2 + T3** (storage plugins) — parallel, depend on T1
3. **T4** (artifact-list) — depends on T2 + T3
4. **T5** (playground) — depends on T4
5. **T6** (cleanup) — can run after T2 + T3, parallel with T4 + T5
6. **T7** (ADR) — can run any time after T1

## Tasks Created
- [ ] 001.md - Extend plugin API with type system and storage interface (parallel: false)
- [ ] 002.md - Create alistigo-local-storage-plugin (parallel: true)
- [ ] 003.md - Create alistigo-claude-storage-plugin (parallel: true)
- [ ] 004.md - Update artifact-list to use storage plugins via CDN (parallel: false)
- [ ] 005.md - Upgrade playground storage tab (parallel: false)
- [ ] 006.md - Cleanup stale references (parallel: true)
- [ ] 007.md - Write ADR 0017 (parallel: true)

Total tasks: 7
Parallel tasks: 4 (002, 003, 006, 007)
Sequential tasks: 3 (001, 004, 005)
Estimated total effort: 14–18 hours
