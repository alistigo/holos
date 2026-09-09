# ADR-0019: Claude Artifact Lifecycle — Draft vs. Published Storage Behavior

**Status:** Accepted
**Date:** 2026-08-06

## Context

Claude artifacts live in two distinct states during their lifecycle:

- **Draft** — the artifact is being edited by the AI. Users see it in the preview panel on the right side of the Claude chat interface. The URL is a generic canvas URL with no artifact ID in the path:
  ```
  https://www.claudeusercontent.com/?domain=claude.ai&…
  ```
- **Published** — the artifact has been shared via the "Publish" action. It is accessible via a permanent public URL containing the artifact UUID:
  ```
  https://www.claudeusercontent.com/artifact/<uuid>?domain=claude.ai&…
  ```

The `window.storage` API (Claude's custom key-value store) behaves fundamentally differently between these two states.

## Draft Mode Storage Limitations

These limitations were confirmed through direct observation and are not documented by Anthropic:

1. **Version-siloed storage.** Each regeneration of an artifact produces a new version (A1-v1, A1-v2, …). Storage is not shared across versions — A1-v2 cannot read data written by A1-v1. Keys written during draft are ephemeral to that specific version.

2. **Shared keys are broken.** The `shared: true` parameter on `window.storage.get/set/list` does nothing in draft mode. The "shared" concept is tied to a published artifact's public URL context.

3. **Storage consent modal is absent.** Claude prompts users to grant storage access only when an artifact tries to use `window.storage` via the public URL. In draft mode there is no prompt — calls appear to succeed but have no persistent effect across versions.

4. **Storage-consent modal dismissal.** Even on a published artifact, if the user closes the Claude storage-consent modal without granting access, all subsequent storage calls fail silently with a postMessage error:
   ```
   event.data.type  = "storageList"
   event.data.error = "error: Storage list failed: Unexpected response type"
   ```
   (The exact message varies by operation type.) The artifact remains accessible, but all `window.storage` calls return errors. A Claude account is required to access published artifacts that use storage.

## Decision

### 1. `artifactContext()` utility in `@alistigo/claude-artifact-api`

Add a synchronous runtime helper that detects the current lifecycle state by inspecting `document.baseURI`:

```typescript
export interface ArtifactContext {
  published: boolean;
  artifactId: string | null;
}

export function artifactContext(): ArtifactContext {
  let path = "";
  try { path = new URL(document.baseURI).pathname; } catch {}
  const m = path.match(/^\/artifact\/([0-9a-f-]{36})/i);
  return { published: Boolean(m), artifactId: m ? m[1] : null };
}
```

`document.baseURI` is the stable discriminator: it is `/artifact/<uuid>` only on the published public URL.

### 2. Guard writes in `@alistigo/claude-storage-plugin`

All four `ClaudeKeyValueStore` methods (`get`, `set`, `del`, `list`) throw immediately when called in draft mode via a shared `requirePublished()` helper.

### 3. Dev-mode override in the playground

`alistigo-artifact-playground` runs all artifacts in a srcdoc iframe. In that context `document.baseURI` is always the playground's own development URL — never a Claude published URL — so `artifactContext()` would always return `{ published: false }`, making it impossible to test published-mode behavior locally.

To work around this, `buildIframeSrcdoc()` injects a global variable when the `aiContext === "claude"` and the **Published** checkbox is checked:

```html
<script>window.claudeArtifactStatus = "published";</script>
```

`artifactContext()` checks this override before inspecting `document.baseURI`:

```typescript
if (typeof window !== "undefined" && window.claudeArtifactStatus === "published") {
  return { published: true, artifactId: null };
}
// … URL-based detection …
```

The **Published** checkbox is visible in the playground's Config tab only when the AI context is set to `claude`. When unchecked, URL-based detection runs — which always resolves to draft inside the playground, correctly simulating the Claude preview panel.

`artifactId` is `null` in this mode (no real UUID is available), which is a known limitation of playground simulation.

### 4. Surface draft state in artifact UIs

Artifacts that rely on storage (particularly `artifact-storage-explorer`) must:
- Detect draft mode at mount time via `artifactContext()`
- Show a visible **Draft** badge in the `ArtifactContextMenuContainer` (orange, with warning icon)
- Render a full-screen grey overlay over interactive content when in draft mode, with an explanation and a call to publish
- Provide a modal (triggered by the Draft badge) explaining all three limitations above

## Rationale

Without this detection and communication:
- End users run the storage explorer in draft mode and see empty data, then assume the artifact is broken.
- Developers testing in draft mode may believe storage is working (writes appear to succeed) when data is actually lost between AI regenerations.
- The shared-key feature is invisible until publication, creating a gap between what's coded and what's tested.

## Consequences

- `@alistigo/claude-artifact-api` now ships runtime code (not just types). The bundle impact is negligible (~150 bytes).
- The write guard in `claude-storage-plugin` is a **breaking change in behavior** for callers that currently swallow all errors — they will now receive thrown errors on draft write attempts. This is intentional: silent failure was misleading.
- Artifact UIs that use `ArtifactContextMenuContainer` gain a `statusBadge` slot; backward compatibility is maintained (existing callers without the prop are unaffected).
- Users opening a storage-aware artifact in draft mode get a clear message instead of confusing empty-state behavior.
