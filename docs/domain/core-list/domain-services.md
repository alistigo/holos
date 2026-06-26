# Domain Services — Core List Context

---

## ListProjector

Stateless domain service. Replays a `ListEventLog` to produce a `ListProjection` — the current observable state of the List.

```
ListProjector.project(log: ListEvent[]): ListProjection
```

### ListProjection shape

```typescript
interface ListProjection {
  listId:   ListId
  elements: ReadonlyArray<{ id: ListElementId; content: ListElementContent }>
}
```

### Rules

- **Deterministic:** same events → identical projection, every time. No randomness, no I/O inside the projector.
- Handles: `ListCreated`, `ListElementAdded`, `ListElementDeleted`
- Ignores: `ListExported` (audit-only event, no effect on projection)
- Element order = insertion order (order of `ListElementAdded` events in the log)
