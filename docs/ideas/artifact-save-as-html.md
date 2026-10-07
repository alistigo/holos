# Idea: Save Artifact as Standalone HTML

## Overview

Export any Alistigo artifact as a **fully self-contained `.html` file** that runs in a browser with no dependency on the Alistigo platform, no AI context, and no internet connection.

Open the file → the artifact works.

---

## Problem

Artifacts today exist inside the AI chat. Their value is tied to that context.
But sometimes you want the artifact itself — the result, the tool, the rendered output — without the surrounding platform.

Examples:
- Share a rendered 3D model with someone who doesn't use Alistigo.
- Use a generated checklist or plant tracker as a standalone page saved on your device.
- Archive the output of an AI session as a portable document.

---

## What "Standalone" Means

The exported file must:

1. **Run offline** — no CDN fetches, no API calls (or graceful degradation when offline).
2. **Have no external dependencies** — all JS, CSS, fonts, and images inlined or bundled.
3. **Preserve state** — the current document/data baked into the HTML (e.g., the list items, the SCAD parameters, the sketch).
4. **Be a single file** — one `.html`, nothing else to carry around.

---

## Implementation Approach

### Bundling

At export time, run a lightweight bundler pass over the artifact's component:

1. Inline all JavaScript (already bundled at build time, just embed as `<script>`).
2. Inline all CSS.
3. Convert external image/font URLs to base64 data URIs.
4. Serialize the current artifact document state into a `<script>` tag:
   ```html
   <script id="__alistigo_snapshot__" type="application/json">
     { "type": "list", "content": { … } }
   </script>
   ```
5. The artifact's bootstrap code reads this snapshot on load instead of fetching from a backend.

### Artifact Cooperation

Each artifact type needs to implement two methods:

```ts
interface StandaloneExport {
  /** Serialize current state to a JSON-serializable snapshot */
  snapshot(): unknown
  /** Boot from a snapshot instead of live data */
  hydrateFromSnapshot(snapshot: unknown): void
}
```

This is a small contract — most artifacts already have this separation internally.

### No-AI Mode

When running standalone, any UI that normally triggers an AI call (e.g., "Ask AI to edit this") should either:
- Be hidden (clean export with no dead buttons).
- Show a placeholder: *"AI features require the Alistigo platform."*

---

## Export Flow

1. User clicks **Save as HTML** in the artifact toolbar.
2. The exporter calls `artifact.snapshot()` to capture current state.
3. Runs the bundling step (inline assets, embed snapshot).
4. Triggers a browser download of `<artifact-name>.html`.

No server round-trip needed — this is entirely client-side.

---

## Comparison with Artifact → PWA

| | Save as HTML | Artifact → PWA |
|---|---|---|
| Output | Single `.html` file | Folder / hosted URL |
| Installable | No | Yes (home screen) |
| Offline | Yes (file on disk) | Yes (service worker) |
| Sharing | Send the file | Share a URL |
| Complexity | Low | Medium |

Both share the same bundling core. "Save as HTML" is the simpler v1; PWA adds the installability layer.

---

## Open Questions

- Size limit: artifacts with large assets (3D models, large images) could produce very large HTML files. Should we warn the user or cap at a threshold?
- Updates: a saved file is a snapshot in time. If the user later modifies the artifact in Alistigo, the saved file is stale. Is that acceptable, or do we need a "sync" mechanism?
- Security: inlining arbitrary JS into a downloadable file is normal but worth noting — the file should not execute any remote code.
