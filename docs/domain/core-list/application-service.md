# ListApplicationService — Application Layer

Orchestration layer between the outside world and the Core List Context. Constructs and dispatches `ActorCommand`s, persists the result, and returns the outcome.

**Does not contain business logic** — that lives in the `List` aggregate.

---

## Interface

```typescript
class ListApplicationService {
  constructor(private repository: ListRepository) {}

  createList(actorId: ActorId, title?: string, listId?: ListId): Promise<Result<AlistigoDocument, ListError>>
  addListElement(listId: ListId, content: string, actorId: ActorId): Promise<Result<AlistigoDocument, ListError>>
  deleteListElement(listId: ListId, listElementId: ListElementId, actorId: ActorId): Promise<Result<AlistigoDocument, ListError>>
  exportListDocument(listId: ListId, actorId: ActorId): Promise<Result<AlistigoDocument, ListError>>
  loadDocument(listId: ListId): Promise<AlistigoDocument | undefined>
}
```

## Pattern per mutating method

**createList:**
1. Generate `listId` if not provided by caller
2. Dispatch `CreateList` command (extends `ActorCommand`)
3. Save new `List`, return `AlistigoDocument`

**addListElement / deleteListElement / exportListDocument:**
1. Load `List` from `ListRepository`
2. Construct and dispatch the `ActorListCommand`
3. On success: save updated `List`, return `AlistigoDocument`
4. On failure: return `ListError` — no exception crosses the application boundary

## Rules

- Returns `Result<T, ListError>` — never throws.
- Always saves after a successful command before returning.
- `loadDocument` is read-only — no command, no save.
