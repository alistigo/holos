# Idea: Artifact → PWA (Progressive Web App) Exporter

## Overview

A tool that converts any Alistigo artifact into an **installable Progressive Web App** — specifically targeting Android home screen installation, but also desktop PWA via Chrome/Edge.

One click. No build step. No app store.

---

## Problem

Artifacts live inside the Alistigo platform (the AI chat context).
But a well-made artifact — a 3D viewer, a plant tracker, a drawing canvas — can be useful *standalone*, without the AI around it.

The PWA exporter answers: *"How do I put this on my phone?"*

---

## What It Produces

A downloadable `.zip` (or hosted URL) containing:

```
dist/
  index.html        # The artifact UI, self-contained
  manifest.json     # PWA manifest (name, icons, display mode)
  sw.js             # Service worker for offline support
  assets/           # JS, CSS, fonts, images
```

When the user navigates to this URL on Android and taps **Add to home screen**, it installs as a standalone app with its own icon, no browser chrome.

---

## Minimal PWA Requirements

| Requirement | Implementation |
|-------------|----------------|
| `manifest.json` | Generated from artifact metadata (name, description, theme colour) |
| HTTPS | Required by browsers — the export is either self-hosted or served via the Alistigo platform |
| Service worker | Basic cache-first strategy for offline use |
| Icons | Auto-generated from the artifact's thumbnail or a default Alistigo icon |
| `display: standalone` | Hides browser UI for a native-app feel |

---

## Export Flow

1. User clicks **Export as App** in the artifact toolbar.
2. A dialog appears asking for: App name, short name (for the home screen), theme colour, and optional icon upload.
3. The exporter bundles:
   - The artifact's rendered HTML + JS (same as the "Save as HTML" idea, but PWA-wrapped).
   - A generated `manifest.json`.
   - A minimal `sw.js`.
4. Output: a `.zip` download *or* a hosted URL (if the Alistigo backend is available).
5. User opens the URL on Android → browser offers "Add to home screen".

---

## Relationship to "Save as HTML"

The [Save as Standalone HTML](./artifact-save-as-html.md) idea produces a portable single file.
This idea adds the PWA layer on top of that:

```
Save as HTML  →  portable execution
Artifact → PWA  →  portable execution + installable + offline-capable
```

They share the same bundling core; PWA just wraps it differently.

---

## Technical Notes

- Service worker generated at export time (no runtime build step needed).
- Offline cache manifest lists all bundled assets — the artifact works with no network after first load.
- For artifacts that talk to a backend (e.g., the MCP doc server), the service worker should pass network requests through (cache-only for static assets, network-first for API calls).

---

## Scope & Limitations

| In scope | Out of scope |
|----------|-------------|
| Android home screen install | Apple App Store / Google Play Store |
| Basic offline support (static artifacts) | Push notifications |
| Single-artifact export | Multi-page app with navigation |
| Chrome / Edge on desktop | Native iOS standalone mode (WKWebView quirks) |

---

## Open Questions

- Should we host the exported PWA on `artifacts.alistigo.app/<id>` for easy sharing, or is download-only sufficient for v1?
- How do we handle artifacts that depend on AI context at runtime? (Either strip the dependency or show a placeholder.)
- Icon generation: use the artifact's first render as a screenshot, or a generic icon?
