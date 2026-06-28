# @alistigo/artifact-manager

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-manager.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

The canonical entrypoint for embedding Alistigo artifacts in HTML. Drop in one `<script>` tag and a JSON config block — the manager validates the config, creates a mount target if needed, and injects the right artifact bundle automatically.

---

## Minimal usage

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list"
}
</script>
```

That's it. No `<div id="app">` required — the manager creates one if none exists.

---

## Config reference

The `#alistigo-manager-config` script tag must contain valid JSON matching the `@alistigo/artifact-config-format` schema.

| Field | Required | Description |
|-------|----------|-------------|
| `app` | **Yes** | Artifact package name — e.g. `"@alistigo/artifact-list"` |
| `lang` | No | BCP-47 language code — e.g. `"nl"`, `"en"` |
| `readonly` | No | List artifact only: prevent edits (default `false`) |

---

## Examples

### Read-only list

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list",
  "readonly": true
}
</script>
```

### With language

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list",
  "lang": "nl"
}
</script>
```

### Pre-seeded with a document

Pass a full `AlistigoDocument` in the config to render an existing list:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list",
  "document": {
    "@context": {
      "@vocab": "https://schema.org/",
      "alistigo": "https://alistigo.ai/vocab/"
    },
    "@type": "ItemList",
    "alistigo:listId": "lst_01h2xcejqtf2nbrexx3vqjhp41",
    "alistigo:schemaVersion": "1.0.0",
    "name": "My List",
    "itemListElement": [
      {
        "@type": "ListItem",
        "alistigo:listElementId": "lse_01h2xcejqtf2nbrexx3vqjhp42",
        "position": 1,
        "name": "Item 1"
      }
    ],
    "alistigo:listEventLog": [
      {
        "alistigo:listEventId": "lev_01h2xcejqtf2nbrexx3vqjhp43",
        "alistigo:eventType": "ListCreated",
        "alistigo:listId": "lst_01h2xcejqtf2nbrexx3vqjhp41",
        "alistigo:actorId": "act_01h2xcejqtf2nbrexx3vqjhp44",
        "alistigo:timestamp": "2026-01-01T00:00:00Z",
        "name": "My List"
      },
      {
        "alistigo:listEventId": "lev_01h2xcejqtf2nbrexx3vqjhp45",
        "alistigo:eventType": "ListElementAdded",
        "alistigo:listId": "lst_01h2xcejqtf2nbrexx3vqjhp41",
        "alistigo:listElementId": "lse_01h2xcejqtf2nbrexx3vqjhp42",
        "alistigo:actorId": "act_01h2xcejqtf2nbrexx3vqjhp44",
        "alistigo:timestamp": "2026-01-01T00:00:00Z",
        "name": "Item 1"
      }
    ]
  }
}
</script>
```

### With an existing mount target

If you want to control where the artifact mounts, add a `<div id="app">` yourself:

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list"
}
</script>
```

---

## Programmatic API

For environments where you control initialization yourself (e.g. a framework or custom boot sequence), import the package as an ES module:

```sh
pnpm add @alistigo/artifact-manager
```

```ts
import { initArtifactManager } from "@alistigo/artifact-manager";

initArtifactManager({
  app: "@alistigo/artifact-list",
  readonly: true,
});
```

`initArtifactManager` validates the config and injects the artifact `<script>` tag into `document.head`. It throws a `TypeError` on invalid config or an `Error` if the artifact is not found in the registry.

---

## How it works

1. The UMD bundle loads and runs immediately (or on `DOMContentLoaded` if the script is in `<head>`)
2. It reads and parses the JSON in `<script id="alistigo-manager-config" type="application/json">`
3. Config is validated against `@alistigo/artifact-config-format` — a `TypeError` is thrown on invalid input
4. If no `<div id="app">` exists, one is appended to `<body>`
5. The artifact's UMD bundle is injected as a `<script>` tag into `<head>` and runs, auto-mounting into `#app`

---

## Error handling

If the config tag is missing or contains invalid JSON or an invalid config shape, the manager renders a red error banner at the top of `<body>` rather than silently failing:

```
@alistigo/artifact-manager: Missing required <script id="alistigo-manager-config" ...> tag.
```

---

## Constraints (M1)

- Text list elements only (no checkboxes, priorities, dates)
- Single artifact per page
- Storage: auto-detected — `window.storage` in Claude artifacts, `localStorage` otherwise
- **Do NOT use `<iframe src="...">` with an external URL** — Claude CSP blocks it
- Full schema: `https://mlkiiwy.github.io/europa/alistigo/latest/en/llms.txt`
