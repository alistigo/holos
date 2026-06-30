# AlistigoDocument format

The `document` config field pre-seeds the list with initial content.

Required structure: one `ListCreated` event followed by one `ListElementAdded` event per item,
all in the `alistigo:listEventLog` array.

## ID prefix conventions

| Prefix | Entity |
|--------|--------|
| `lst_` | List |
| `lse_` | List element |
| `lev_` | Event |
| `act_` | Actor |

Use UUIDv7 URNs for all IDs.

## Full example — one pre-seeded item

```json
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
```

## Full schema reference

`https://mlkiiwy.github.io/europa/alistigo/latest/en/llms.txt`
