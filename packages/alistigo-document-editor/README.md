# @alistigo/document-editor

The Application layer of the Alistigo system. **Pure, no UI.** Takes an `AlistigoDocument` in, accepts commands, produces events, folds them into a new document.

This is what `architecture.md` calls the *Application Layer (CQRS)*: commands → events → projector → document. The package mirrors that contract one-to-one.

## What it owns

| Concept | API |
|---------|-----|
| Command catalog (intent) | `AlistigoCommand` discriminated union (`CreateList`, `AddElement`, `DeleteElement`, `RenameList`) |
| Command → events | `commandToEvents(doc, command)` |
| Events → document | `applyEvents(doc, events)` (delegates projection to `@alistigo/document-format`'s `replayEvents`) |
| Bootstrap a doc with no log | `bootstrap(doc)` |
| Stateful wrapper for UI | `createEditor(doc) → { document, dispatch, subscribe }` |
| Empty starting document | `emptyDocument({ name?, listType?, plugins? })` |

## What it does NOT own

- React, the DOM, any UI primitive — see `@alistigo/list-components-react`.
- Persistence — the EventStore adapters live with the embedded app.
- Schema validation — see `@alistigo/document-format`'s `validateDocument`.

## Core API

### `createEditor(initial, options?) → Editor`

```ts
import { createEditor, emptyDocument } from "@alistigo/document-editor";

const editor = createEditor(emptyDocument({ name: "Today" }));

editor.dispatch({ type: "AddElement", text: "Buy bread" });
editor.dispatch({ type: "AddElement", text: "Buy milk" });

console.log(editor.document.projection.itemListElement);
// [{ position: 1, item: { name: "Buy bread", … } }, { position: 2, item: { name: "Buy milk", … } }]

const unsub = editor.subscribe((doc) => {
  // re-render from doc.projection
});

const idOfMilk = editor.document.projection.itemListElement[1].item["@id"];
editor.dispatch({ type: "DeleteElement", elementId: idOfMilk });

unsub();
```

`Editor` is synchronous: every `dispatch` finishes before it returns, listeners run synchronously in registration order. That keeps the React `useSyncExternalStore` integration trivial and removes "did the projection update before we read it?" foot-guns.

### Pure helpers

For tests / non-React consumers:

```ts
import { commandToEvents, applyEvents, emptyDocument } from "@alistigo/document-editor";

const doc0 = emptyDocument({ name: "Today" });
const events = commandToEvents(doc0, { type: "AddElement", text: "Buy bread" });
const doc1 = applyEvents(doc0, events);
```

### Bootstrap from a projection-only document

Per `architecture.md` §5.1 — a document arriving from an LLM (or via the inline `<script id="alistigo-document">` tag in production) may have only a projection and no event log. `createEditor` calls `bootstrap` on construction to synthesize a fresh log: one `ListCreated`, then one `ElementAdded` per existing element in projection order. From that point on the synthesized log is authoritative.

If the document already has a non-empty `eventLog`, bootstrap trusts it as-is — fixing up a real log here would risk breaking replay-equivalence.

## Testing

`pnpm -F @alistigo/document-editor test` runs the bun test suite. Determinism in tests is achieved by injecting a custom `IdGenerator` via `createEditor(initial, { ids })` — see `src/editor.test.ts`.

## Design constraints

- **Pure.** No DOM, no `localStorage`, no random outside `IdGenerator`. This is what makes the runner fast and the projection cacheable.
- **Synchronous.** Commands that need IO (persisting events, talking to a host) belong one layer above — the editor never `await`s.
- **Append-only.** Events are facts; the package never edits or deletes a previously emitted event. Undo is a future compensating event, not a log mutation.
- **Format is the source of truth.** The projector lives in `@alistigo/document-format`; the editor never re-implements projection. New event types land in the format package first, then the editor adds a command that emits them.
