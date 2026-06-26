# ListEvents — Core List Context

All ListEvents are **immutable facts**. Once emitted they are never modified or deleted. They form the `ListEventLog` — the source of truth for all List state.

---

## ListEvent (base)

All events extend this base type:

```
ListEvent {
  listEventId: ListEventId
  listId:      ListId
  actorId:     ActorId
  timestamp:   Timestamp
}
```

---

## ListCreated

```
ListCreated extends ListEvent {
  title?: string
}
```

Emitted when a new List aggregate is instantiated via `List.create()`.

---

## ListElementAdded

```
ListElementAdded extends ListEvent {
  listElementId: ListElementId
  content:       ListElementContent
}
```

Emitted when a ListElement is appended to the List. The `listElementId` is assigned here — it identifies this ListElement for its entire lifetime.

---

## ListElementDeleted

```
ListElementDeleted extends ListEvent {
  listElementId: ListElementId
}
```

Emitted when a ListElement is removed. The `listElementId` is permanently retired and will never be reused.

---

## ListExported

```
ListExported extends ListEvent {
  format: 'json-ld'
}
```

Emitted when a ListDocument export is requested. Records the intent in the audit log; the `AlistigoDocument` itself is the return value of the `ExportListDocument` command handler.
