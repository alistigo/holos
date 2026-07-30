---
name: claude-storage-explorer
description: A standalone Claude artifact that lets developers browse, inspect, and delete keys from the Claude storage API exposed by the inject-script bridge
status: active
created: 2026-07-30T00:00:00Z
---

# PRD: claude-storage-explorer

## Executive Summary

Claude injects a small bridge script into every HTML artifact iframe that exposes `window.storage` — a promise-based API for per-conversation key-value storage. Developers using this storage have no way to inspect what's actually in it during development or debugging. This PRD covers a standalone Claude artifact (`@alistigo/artifact-storage-explorer`) that acts as a storage inspector: list all private and shared keys, view their JSON values, and delete individual keys. It ships as an npm package so any developer can paste one script tag into a Claude conversation and immediately see the storage state.

## Problem Statement

1. **No visibility into `window.storage`.** When an artifact uses Claude's storage API, there is no built-in way to inspect what keys exist, what their values look like, or how many entries have accumulated. Developers are blind to the storage state.

2. **Debugging is slow.** Adding `console.log(await window.storage.list(''))` to an artifact, rebuilding, and parsing raw JSON output in the console is the only current workaround. It's friction-heavy and breaks the development flow.

3. **No first-class delete.** Cleaning up stale or corrupted keys requires writing custom cleanup code or knowing the exact key name to delete.

4. **The inject-script API is undocumented for most developers.** Few people know that `window.storage` exists in Claude artifacts; a working tool demonstrating its use doubles as documentation.

## User Stories

### As a developer building a Claude artifact:
- I want to paste one script tag into a Claude conversation and see all my artifact's storage keys, so I can verify my storage logic works without adding debug code to my artifact.
- Acceptance: `@alistigo/artifact-storage-explorer@0` loads and shows private and shared keys within 2 seconds.

### As a developer debugging a storage bug:
- I want to click a key and see its JSON value formatted and navigable, so I can spot malformed data or unexpected values instantly.
- Acceptance: clicking a key shows pretty-printed JSON with expand/collapse.

### As a developer cleaning up stale data:
- I want to delete individual keys from the explorer without leaving the artifact, so I can reset storage state during testing.
- Acceptance: delete button below the viewer, loading state while delete is in progress, list refreshes after.

### As a developer who only cares about a specific namespace:
- I want to type a prefix to filter keys, so I don't see noise from other artifacts sharing the same storage space.
- Acceptance: prefix field at top of artifact, filters both private and shared key lists.

## Functional Requirements

| ID | Requirement |
|----|-------------|
| F1 | Artifact calls `window.storage.list(prefix, false)` for private keys on mount and prefix change |
| F2 | Artifact calls `window.storage.list(prefix, true)` for shared keys on mount and prefix change |
| F3 | Private and shared keys are displayed in separate sections ("Private" / "Shared") |
| F4 | Each section shows a scrollable list of key names on the left (2/5 width) |
| F5 | Clicking a key shows its value in a JSON viewer on the right (3/5 width) |
| F6 | JSON viewer uses expand/collapse tree for object values; falls back to `<pre>` for primitives |
| F7 | Both the key list and JSON viewer show a loading state while async operations are pending |
| F8 | A delete button appears below the JSON viewer when a key is selected |
| F9 | Clicking delete calls `window.storage.delete(key, isShared)`, shows a deleting state, then refreshes the list |
| F10 | A prefix text input at the top of the artifact filters both sections simultaneously |
| F11 | A refresh button reloads both key lists from `window.storage` |
| F12 | Artifact auto-mounts from `<script type="application/json" id="alistigo-config">{"app":"@alistigo/artifact-storage-explorer","prefix":""}` |
| F13 | The `explorer-components-react` library provides all UI components with Storybook stories |
| F14 | Skill package `@alistigo/artifact-storage-explorer-skill` is published with triggers for storage debugging |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | UMD bundle is self-contained — no external runtime dependencies |
| NF2 | Bundle loads and renders in under 2 seconds on a standard connection |
| NF3 | All components have loading and empty states — no layout shift or blank screens |
| NF4 | Component library (`explorer-components-react`) has full Storybook coverage |
| NF5 | Typecheck and lint pass across all new packages |

## Success Criteria

- `nx run artifact-storage-explorer:build` produces `dist/index.umd.js`
- Playground: selecting `@alistigo/artifact-storage-explorer` loads the artifact in the iframe and shows simulated storage entries
- All Storybook stories render without errors
- `pnpm build:typecheck` passes with zero errors

## Constraints & Assumptions

- `window.storage` is only available inside Claude artifact iframes (the inject-script provides it)
- The playground simulates the storage API — the artifact will work in the playground's dev environment
- Editing values is explicitly out of scope for v1
- No i18n — this is a developer tool, English only

## Out of Scope

- **Editing key values** — read-only and delete only in v1; editing is deferred to v2
- **Bulk operations** — delete all, export — v2
- **Cross-artifact storage inspection** — only the artifact's own storage namespace is relevant
- **dev.to post** — LinkedIn only for initial launch communication

## Dependencies

- `@uiw/react-json-view` — already installed in playground, reuse for JSON display
- `packages/artifact-core` — existing artifact infrastructure package
- `packages/artifact-manager` — registry where the artifact is registered
