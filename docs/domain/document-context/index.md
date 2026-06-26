# Document Context — Overview

**Type:** Supporting Domain

Responsible for the public, versioned `AlistigoDocument` format — the JSON-LD representation of a List that AI systems and the ListWidget exchange. Translates between the Core List Context's internal model and this shared language via an Anticorruption Layer.

---

## Contents

| Document | What it covers |
|---|---|
| [this file](index.md) | Context overview + AlistigoDocument JSON-LD format |
| [serializer.md](serializer.md) | ListDocumentSerializer (Anticorruption Layer) |

---

## AlistigoDocument Format

> **Authoritative spec:** The full JSON Schema for `AlistigoDocument` is defined and maintained in `packages/alistigo-document-format`. This document describes the shape and intent; the package is the source of truth for validation, TypeScript types, and versioning.

The `AlistigoDocument` is JSON-LD using `schema.org/ItemList` and `schema.org/ListItem`. Custom Alistigo properties are namespaced under `https://alistigo.ai/vocab/`.

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "alistigo": "https://alistigo.ai/vocab/"
  },
  "@type": "ItemList",
  "alistigo:listId": "lst_01h2xcejqtf2nbrexx3vqjhp41",
  "alistigo:schemaVersion": "1.0.0",
  "name": "<optional title>",
  "itemListElement": [
    {
      "@type": "ListItem",
      "alistigo:listElementId": "lse_01h2xcejqtf2nbrexx3vqjhp42",
      "position": 1,
      "name": "<ListElementContent>"
    }
  ],
  "alistigo:listEventLog": [
    {
      "alistigo:listEventId":   "lev_01h2xcejqtf2nbrexx3vqjhp43",
      "alistigo:eventType":     "ListElementAdded",
      "alistigo:listId":        "lst_01h2xcejqtf2nbrexx3vqjhp41",
      "alistigo:listElementId": "lse_01h2xcejqtf2nbrexx3vqjhp42",
      "name":                   "<ListElementContent>",
      "alistigo:actorId":       "act_01h2xcejqtf2nbrexx3vqjhp41",
      "alistigo:timestamp":     "2026-05-14T10:00:00Z"
    }
  ]
}
```

### Key properties

| Property | Role |
|---|---|
| `itemListElement` | **ListProjection** — current visible state; position is 1-based insertion order |
| `alistigo:listEventLog` | **ListEventLog** — append-only source of truth |
| `alistigo:schemaVersion` | Enables migration when deserializing older documents |

### Invariant

Replaying `alistigo:listEventLog` through `ListProjector` must always reproduce `itemListElement`. Verified by the acceptance runner.
