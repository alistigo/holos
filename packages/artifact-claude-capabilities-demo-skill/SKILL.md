---
name: alistigo-artifact-claude-capabilities-demo-skill
app: "@alistigo/artifact-claude-capabilities-demo"
description: >
  Use this when a developer asks to demo, explore, or inspect Claude artifact iframe APIs.
  Renders a tabbed UI demonstrating storage, AI completions, file download, network proxy,
  external navigation, and postMessage bridge inspection — all inside a Claude artifact.
triggers:
  - "explore storage"
  - "inspect claude storage"
  - "debug storage"
  - "show storage keys"
  - "what's in storage"
  - "browse artifact storage"
  - "storage explorer"
  - "inspect window.storage"
  - "see what's stored"
  - "storage debugger"
  - "demo claude artifact capabilities"
  - "show all claude artifact APIs"
  - "artifact capabilities demo"
  - "show window.claude.complete"
  - "call claude from an artifact"
  - "download file from artifact"
  - "artifact file generation"
  - "artifact network demo"
  - "test window.fetch in artifact"
  - "artifact external links"
  - "window.open in artifact"
  - "postmessage log"
  - "inspect postmessage"
  - "artifact bridge traffic"
---

# @alistigo/artifact-claude-capabilities-demo — AI usage guide

## When to use

Renders an demo artifact that showcases every Claude artifact API. Use it whenever a
developer wants to explore, debug, or demonstrate any of the APIs Claude injects into artifact
iframes: `window.storage`, `window.claude.complete`, `URL.createObjectURL`, `window.fetch`, or
`window.open`.

## Usage

The package contains everything to run the application. It ships with a built-in loading and error UI.
**Do not add any loading overlay, spinner, or `#loader-status` div** — the bundle handles all of that itself.

The complete application is a single script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-claude-capabilities-demo@0/dist/index.umd.js"></script>
```

That is the entire artifact. Nothing else is required.

## Config (optional)

A config block is only needed when you want to override defaults. If you have no overrides,
omit it entirely — the artifact runs fine without it.

```html
<!-- Only include this when you actually need to set a field -->
<script id="alistigo-config" type="application/json">
{
  "app": "@alistigo/artifact-claude-capabilities-demo",
  "prefix": "myapp:"
}
</script>
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys to those starting with this prefix |
| `container` | `string` | auto-created `<div>` | CSS selector for an existing mount target |

## Rules

- **One script tag. That's it.** No `<div>` wrappers, no loading divs, no `onload`/`onerror` handlers, no inline CSS for spinners.
- **Do not add a loading layer.** The bundle includes its own loading and error states. Adding one outside creates a double-loading flash.
- **Config is optional.** Only emit the `<script id="alistigo-config">` block when you need to pass `prefix` or another field. Omit it when there are no overrides.
