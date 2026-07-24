---
name: storage-as-plugin
description: Refactor storage backends into first-class CDN-loaded plugins, aligning them with the composable plugin system and upgrading the playground storage tab
status: active
created: 2026-07-24T11:45:10Z
---

# PRD: storage-as-plugin

## Executive Summary

Storage in `@alistigo/artifact-list` is hard-coded in `App.tsx` via direct `if/else` context detection. Every other cross-cutting concern (error monitoring, analytics) has been moved to the composable CDN-loaded plugin system established in ADR 0016 — storage must follow. This PRD covers the refactor of the two storage backends into typed plugins, the introduction of a plugin type system, the package renames, and the upgrade of the playground's storage inspection tab.

## Problem Statement

1. **Storage is not composable.** `App.tsx` hardcodes `isClaudeArtifactContext()` and directly instantiates either `ClaudeArtifactListRepository` or `LocalStorageListRepository`. Adding a third storage backend (e.g., IndexedDB, a remote API) requires modifying the artifact host code.

2. **Inconsistent naming.** The two storage packages (`alistigo-local-storage-repository`, `alistigo-claude-artifact-list-storage`) do not follow the `*-plugin` naming convention used by Sentry and PostHog.

3. **No plugin type system.** The `AlistigoPlugin` interface has no `type` field. As more plugin categories emerge (monitoring, storage, future domain plugins), operators and tooling have no way to query or filter by type.

4. **Playground storage tab is incomplete.** The storage tab only shows Claude storage entries. localStorage entries are invisible, so developers cannot inspect what the artifact writes to localStorage during development.

## User Stories

### As a developer embedding `@alistigo/artifact-list`:
- I want storage to be configured via the `plugins` config, just like Sentry and PostHog, so I can swap or extend storage without touching the host's source code.
- Acceptance: adding `"@alistigo/my-custom-storage-plugin": {}` to `config.plugins` makes it the active storage if `isAvailable()` returns true.

### As a developer testing the artifact in the playground:
- I want to see both localStorage and Claude storage entries in the storage tab at all times, so I can verify what the artifact reads/writes regardless of the active AI context.
- Acceptance: the storage tab always shows two sections ("Local Storage", "Claude Storage (simulated)") with live entries.

### As a platform owner:
- I want all storage backends to follow the same CDN-loaded, independently-versioned pattern as other plugins, so a new storage option can be published and adopted via config change alone.
- Acceptance: both storage plugins load from jsDelivr with `@0` pin, same as Sentry/PostHog.

### As a contributor reading the plugin API:
- I want plugin objects to carry a `type` field so tooling can reason about plugin categories.
- Acceptance: `type: "monitoring"` on Sentry/PostHog; `type: "storage"` on storage plugins.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| F1 | `AlistigoPlugin` has an optional `type?: PluginType` field ("monitoring" \| "storage" \| open string) |
| F2 | `AlistigoPlugin` has an optional `storage?: AlistigoStorageExtension` field (isAvailable, createStore, listKeys, seedIfEmpty?) |
| F3 | `@alistigo/local-storage-plugin` implements `AlistigoPlugin` with `type: "storage"` and the `storage` extension |
| F4 | `@alistigo/claude-storage-plugin` implements `AlistigoPlugin` with `type: "storage"` and the `storage` extension |
| F5 | Both storage plugins are CDN-loaded via the existing jsDelivr mechanism |
| F6 | `mount()` injects both storage plugins into the spec by default (claude first, local second) |
| F7 | `mount()` resolves the active store by picking the first storage plugin where `isAvailable()` returns true |
| F8 | If no storage plugin is available or loads, the artifact falls back to an in-memory store (no error) |
| F9 | Priority is determined by insertion order in the plugin spec |
| F10 | Playground storage tab shows two always-visible sections: "Local Storage" and "Claude Storage (simulated)" |
| F11 | Both plugins expose `listKeys(prefix?)` that the playground host can call directly |
| F12 | Both plugins ship with the same self-contained ESM bundle build pattern as Sentry/PostHog |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | Storage plugin CDN failure must not crash the artifact — fallback to in-memory |
| NF2 | No breaking change to the `AlistigoPlugin` interface (all new fields are optional) |
| NF3 | `App.tsx` must have zero imports from storage packages after this refactor |
| NF4 | All packages must typecheck and build cleanly |
| NF5 | Old npm package names must not appear in any `packages/` or `apps/` source file |

## Success Criteria

- `pnpm build && pnpm build:typecheck` passes with zero errors after all tasks
- Playground storage tab shows both sections; Local Storage populates when artifact writes to localStorage
- `grep -r "local-storage-repository\|claude-artifact-list-storage" packages/ apps/` returns zero hits
- ADR 0017 is written and linked in `docs/adrs/README.md`

## Constraints & Assumptions

- Plugins must be self-contained ESM bundles (same constraint as ADR 0016 — no bare-specifier imports)
- The playground can import workspace packages directly (dev tool, not production artifact)
- `window.storage` is not available in the playground host frame — Claude storage tab relies on `useClaudeStorageSimulator`
- The `storage` window event fires when localStorage is mutated from another frame of the same origin, enabling live updates

## Out of Scope

- Implementing new storage backends (IndexedDB, remote API)
- Adding storage plugin toggle UI to the playground Config tab
- Per-plugin jsDelivr version-pin override
- `type` field on existing Sentry and PostHog plugins (they can be updated in a follow-up)

## Dependencies

- ADR 0016: Composable Artifact Plugin System (foundation — this epic extends it)
- ADR 0005: Storage in Claude Artifact Context (superseded by this epic)
- `@alistigo/artifact-plugin-api` must be bumped before storage plugins can reference the new types
