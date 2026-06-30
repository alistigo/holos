---
name: artifact-list
app: "@alistigo/artifact-list"
description: >
  Embed the Alistigo list widget — an interactive, persistent list/checklist
  powered by AlistigoDocument. Use via @alistigo/artifact-manager.
triggers:
  - "add a list"
  - "create a checklist"
  - "embed a list widget"
  - "show a to-do list"
  - "create a task list"
  - "interactive list"
  - "@alistigo/artifact-list"
---

# @alistigo/artifact-list — AI usage guide

## When to use

Renders an interactive, editable list with persistent storage (`window.storage` in Claude,
`localStorage` elsewhere). Use whenever the user asks to track tasks, items, or a checklist
inside a Claude HTML artifact.

## Config fields

App-specific fields — add these inside the manager config alongside `app`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `readonly` | `boolean` | `false` | Prevents user edits when `true` |
| `document` | `AlistigoDocument` | empty list | Pre-seeded list content |

## AlistigoDocument format

The `document` field pre-seeds the list. Required structure: one `ListCreated` event and
one `ListElementAdded` event per item in `alistigo:listEventLog`.

ID prefix conventions:
- `lst_` — list ID
- `lse_` — list element ID
- `lev_` — event ID
- `act_` — actor ID

Example with one pre-seeded item:

```json
{
  "app": "@alistigo/artifact-list",
  "document": {
    "@context": {"@vocab": "https://schema.org/", "alistigo": "https://alistigo.ai/vocab/"},
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
```

## Full reference

See [README.md](./README.md) and the full schema at `https://mlkiiwy.github.io/europa/alistigo/latest/en/llms.txt`.
