# ADR-005: Storage in Claude Artifact Context — window.storage over localStorage

**Status:** Accepted
**Date:** 2026-06-02
**Source:** projects/alistigo-ai/research/claude-artifacts-capabilities.md

## Context

The Alistigo embedded app uses `LocalStorageListRepository` (wraps `window.localStorage`) for list persistence. When the widget runs inside a Claude artifact, a different storage backend is needed.

## Decision

Create `@alistigo/claude-artifact-list-storage` package that implements `ListRepository` using Claude's `window.storage` API. The app auto-detects the context at boot time: if `window.storage` is present, use `ClaudeArtifactListRepository`; otherwise fall back to `LocalStorageListRepository`.

## Rationale

Live CSP inspection confirmed:
- `localStorage` and `sessionStorage` are **blocked** in Claude artifacts by the sandbox attribute (not CSP). API calls succeed but data is not persisted.
- `window.storage` is Claude's custom persistent key-value store. It persists across artifact sessions, with 5 MB per key and a 200-char key limit.

Key format `alistigo-{listId}` satisfies all `window.storage` key constraints (no whitespace, no `/`, `\`, `'`, `"`).

## Consequences

- Two new packages: `alistigo-local-storage-repository` (extract from embedded app) and `alistigo-claude-artifact-list-storage` (new)
- Boot-time context detection via `isClaudeArtifactContext()` — checks for `window.storage?.get`
- `window.storage` throws on missing keys (does not return null); all load calls need try/catch
- `shared: false` (default) → per-user storage; `shared: true` → all viewers of the artifact share the list
