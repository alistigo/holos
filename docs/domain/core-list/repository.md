# ListRepository — Interface

Only one Repository exists in the Core List Context — for the `List` aggregate root. The domain layer defines the interface; infrastructure provides the implementation.

---

## Interface

```typescript
interface ListRepository {
  load(id: ListId): Promise<List | undefined>
  save(list: List): Promise<void>
}
```

## Rules

- Only the `List` aggregate root has a Repository — ListElements are not loaded or saved independently.
- `save()` persists the full List state (serialized as `AlistigoDocument` via `ListDocumentSerializer`).
- `load()` returns `undefined` for an unknown `ListId` — callers must handle the missing case.

## M1 Implementation

`LocalStorageListRepository` — lives in `packages/alistigo-widget/src/infrastructure/`.

- Storage key: `alistigo:list:<ListId>`
- Storage value: `JSON.stringify(AlistigoDocument)`
- Falls back gracefully when `localStorage` is unavailable (private browsing, SSR)
