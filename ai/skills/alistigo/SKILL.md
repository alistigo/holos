---
name: alistigo
description: Embed an Alistigo list widget in a Claude HTML artifact or standalone page using @alistigo/artifact-manager. Use when asked to add a list to an artifact.
metadata:
  type: embedding
---

# Alistigo — Embedding in Claude HTML Artifacts

Always use `@alistigo/artifact-manager` as the entrypoint. Never load `@alistigo/artifact-list` directly.

## Quick Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
  <script id="alistigo-manager-config" type="application/json">
  {
    "app": "@alistigo/artifact-list"
  }
  </script>
</head>
<body class="p-4">
</body>
</html>
```

No `<div id="app">` needed — the manager creates one automatically.

## Pre-seeding with a document

Put the document inline in the config tag:

```html
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list",
  "document": {
    "@context": {"@vocab": "https://schema.org/", "alistigo": "https://alistigo.ai/vocab/"},
    "@type": "ItemList",
    "alistigo:listId": "lst_01h2xcejqtf2nbrexx3vqjhp41",
    "alistigo:schemaVersion": "1.0.0",
    "name": "My List",
    "itemListElement": [
      { "@type": "ListItem", "alistigo:listElementId": "lse_01h2xcejqtf2nbrexx3vqjhp42", "position": 1, "name": "Item 1" }
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

## Config fields

| Field | Required | Description |
|-------|----------|-------------|
| `app` | **Yes** | `"@alistigo/artifact-list"` |
| `lang` | No | BCP-47 code — omit unless a specific locale is requested |
| `readonly` | No | `true` to prevent edits |
| `document` | No | Pre-populated `AlistigoDocument` |

## Rules

- The config tag `id` must be exactly `alistigo-manager-config`, type `application/json`
- Only include fields that are in the schema — no extras
- **Do NOT use `<iframe src="...">` with external URLs** — Claude CSP blocks it
- Storage: auto-detected — `window.storage` in Claude, `localStorage` otherwise
- Full schema: `https://mlkiiwy.github.io/europa/alistigo/latest/en/llms.txt`
