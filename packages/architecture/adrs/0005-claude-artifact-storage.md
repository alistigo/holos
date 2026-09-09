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

- Two new packages: `alistigo-local-storage-plugin` (extract from embedded app) and `alistigo-claude-storage-plugin` (new)
- Boot-time context detection via `isClaudeArtifactContext()` — checks for `window.storage?.get`
- `window.storage` throws on missing keys (does not return null); all load calls need try/catch
- `shared: false` (default) → per-user storage; `shared: true` → all viewers of the artifact share the list

## Observed Storage Limits (empirical, 2026-08-13)

Limits discovered through live testing of the capabilities-demo artifact. These are not officially documented by Anthropic.

| Constraint | Value | Notes |
|---|---|---|
| Max value per key | **< 5 MiB** (exclusive) | `set()` throws `Internal server error while processing action` at ≥ 5 MiB |
| Max total storage per artifact | **17 MiB** | Combined private + shared keys; any `set()` fails when total ≥ 17 MiB |
| Max number of keys | **No observed limit** | No documented or discovered ceiling on key count |
| Max key length | < 200 chars | Documented constraint; whitespace and `/`, `\`, `'`, `"` forbidden |

### Value Types (empirical, 2026-08-14)

`window.storage.set()` only accepts **string** values. Passing a `Blob` or `ArrayBuffer` throws:

    Storage set failed: Invalid payload content

All file uploads must be base64-encoded strings. The Blob and ArrayBuffer storage formats are not
supported and have been removed from the UI. The `ClaudeStorage.set()` and `ClaudeStorage.get()`
types in `@alistigo/claude-artifact-api` are restricted to `string` values accordingly.

### Clarifications

- **Per-key limit is strictly exclusive**: a value of exactly 5 MiB (5 × 1,048,576 bytes) triggers the error. Values must be < 5 MiB.
- **Total limit applies to the artifact as a whole**, not per-user. Both private (`shared: false`) and shared (`shared: true`) keys count toward the same 17 MiB budget. Once the aggregate reaches 17 MiB, every further `set()` call fails regardless of individual key size.
- **Base64 overhead**: binary files uploaded via `data:` URIs are approximately 4/3× their original size when stored as strings. A 3.75 MiB file encodes to ≈ 5 MiB stored — already at the per-key limit. The safe upload ceiling is ≈ 3.74 MiB per file.
- **The 17 MiB budget is shared across all users** of the same artifact URL (the `shared` flag controls read visibility, not which bucket contributes to the total).
