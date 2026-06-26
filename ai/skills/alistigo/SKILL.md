---
name: alistigo
description: Embed the Alistigo list widget in a Claude HTML artifact using npm/jsDelivr. Use when asked to add a list to an artifact.
metadata:
  type: embedding
---

# Alistigo — Embedding in Claude HTML Artifacts

## Quick Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
</head>
<body class="p-4">
  <div id="app"></div>
  <script>Alistigo.mount('#app');</script>
</body>
</html>
```

## Pre-seeding with a document

```js
Alistigo.mount('#app', {
  document: {
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
});
```

## Constraints (M1)

- Text elements only (no checkboxes, priorities, dates)
- Single list per artifact
- Storage: auto-detected — `window.storage` in Claude, `localStorage` otherwise
- **Do NOT use `<iframe src="...">` with an external URL** — Claude CSP blocks it
- Full schema: `https://mlkiiwy.github.io/europa/alistigo/latest/en/llms.txt`
