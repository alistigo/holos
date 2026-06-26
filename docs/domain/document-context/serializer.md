# ListDocumentSerializer — Anticorruption Layer

Stateless domain service in the Document Context. Translates between the Core List Context's internal `List` aggregate and the public `AlistigoDocument` JSON-LD format.

All schema.org vocabulary mapping lives here — the Core List Context knows nothing about JSON-LD.

---

## Interface

```
ListDocumentSerializer.serialize(list: List): AlistigoDocument
ListDocumentSerializer.deserialize(doc: AlistigoDocument): List
```

## Rules

- **serialize:** builds `itemListElement` from the current `ListProjection` and `alistigo:listEventLog` from uncommitted + committed events.
- **deserialize:** replays `alistigo:listEventLog` event-by-event through `List.applyEvent()` to rehydrate the aggregate.
- **Round-trip invariant:** `deserialize(serialize(list))` must produce an equivalent `List` — same `listId`, same elements, same event count.
- Applies schema migrations when `alistigo:schemaVersion` differs from the current version.
