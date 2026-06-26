# List — Aggregate Root

**Aggregate root:** `List`
**Boundary:** A List owns all its ListElements. No external code modifies ListElements directly.

---

## Identity

- `ListId` — `TypeID<"lst">` assigned at `ListCreated` time.

## State (derived from ListProjection)

- `elements: ListElement[]` — ordered by insertion time, no gaps.
- `title: string | undefined` — optional display name (M2+; present in model for forward compatibility).

## Invariants

1. Each ListElement in the List has a unique `ListElementId`.
2. Duplicate `ListElementContent` values are allowed — identity is not content-based.
3. ListElement order reflects insertion order; order is not user-sortable in M1.
4. A deleted ListElement's `ListElementId` is never reused.
5. The List starts empty; all state changes flow through `ActorCommand`s.

## Factory

```
List.create(cmd: CreateList): ListCreated
```

Creates a new List and emits `ListCreated`.
Private constructor enforces factory use.

## Command Handlers

```
List.create(cmd: CreateList): ListCreated
List.addListElement(cmd: AddListElement): ListElementAdded
List.deleteListElement(cmd: DeleteListElement): ListElementDeleted
List.exportListDocument(cmd: ExportListDocument): [AlistigoDocument, ListExported]
```

## Rehydration

```
List.applyEvent(event: ListEvent): void   // private — replays a single event onto state
List.getUncommittedEvents(): ListEvent[]  // events since last load/save
```
