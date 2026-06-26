# ListElement — Entity

Owned by `List`. Accessed and mutated only through the `List` aggregate root.

---

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `ListElementId` | Stable identity — never changes |
| `content` | `ListElementContent` | Current text content |
| `addedAt` | `Timestamp` | When the element was added (from `ListElementAdded` event) |

## Rules

- ListElements do **not** have their own Repository — loaded and saved as part of the List aggregate.
- Identity (`ListElementId`) is assigned once at `ListElementAdded` time and is never reused, even after deletion.
- Content equality is **not** identity — two ListElements may have the same text and are still distinct entities.
