# Validating an Alistigo Document

There are **three layers** of validation, applied in order. A document is "valid" only when it passes all three.

| Layer | What it checks | Tool | When to run |
|-------|---------------|------|--------------|
| **1. Schema** | Structure, types, required fields, enums, patterns. | JSON Schema (Ajv) against `documentSchema`. | Always — before anything else. |
| **2. Plugin schemas** | `alistigo:*` fields conform to the schemas of the plugins declared in `meta.plugins`. | JSON Schema fragments composed at runtime. | When `meta.plugins` is non-empty. |
| **3. Replay equivalence** | When `meta.eventLog.presence` is `full`, `replayEvents(eventLog)` reproduces `projection`. | The library's `replayEvents()` + a multiset compare. | Whenever the eventLog is present and you want strong correctness. |

Each layer catches a different class of bug. Skipping layer 3 is fine for transport ("does this look valid enough to render?") but never for storage ("can I trust this is what the user intended?").

---

## Layer 1 — Schema

Use the bundled helper:

```ts
import { validateDocument } from "@alistigo/document-format";

const result = await validateDocument(unknownInput);
if (!result.valid) {
  console.error("Document failed schema validation:");
  for (const err of result.errors) console.error("  -", err);
  return;
}
// safe to treat as AlistigoDocument from here on
```

Or, if you want to control Ajv directly:

```ts
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { documentSchema } from "@alistigo/document-format";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(documentSchema);

if (!validate(unknownInput)) {
  // validate.errors is the structured list — render however you want
}
```

The schema is comprehensive: it checks `@context`, the three sections, every required field per section, the eventLog presence/integrity descriptor, every event's payload shape per `eventType`, and the `unevaluatedProperties: false` strictness on every object.

What schema validation does **not** catch:
- Cross-section consistency (e.g. `meta.listId` must equal every `event.listId` and any `item.@id` must come from an `ElementAdded` event).
- Plugin-specific fields (those need plugin schemas, layer 2).
- Replay correctness (layer 3).

---

## Layer 2 — Plugin schemas

When `meta.plugins` is non-empty, every plugin contributes a schema fragment that describes the `alistigo:*` fields it owns. At validation time the runtime composes the base schema with every declared plugin's schema:

```ts
// pseudo-code — the actual API will be in @alistigo/plugin-api (M2)
import { documentSchema } from "@alistigo/document-format";
import { prioritySchema } from "@alistigo/plugin-priority";
import { dueDateSchema } from "@alistigo/plugin-due-date";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(prioritySchema, prioritySchema.$id);
ajv.addSchema(dueDateSchema, dueDateSchema.$id);

const validate = ajv.compile(documentSchema);
// → also validates alistigo:priority and alistigo:dueDate fields
```

A document that uses `alistigo:priority` but does NOT declare `"priority"` in `meta.plugins` fails layer 2 — that's intentional. Plugins must be declared.

This layer is M2+ — in M1 (no plugins yet) it's a no-op.

---

## Layer 3 — Replay equivalence

When the eventLog is present, the projection must equal the result of replaying the events. This is the **strongest correctness check** and the only one that catches "the projection got out of sync with the log" bugs.

Pseudo-code for the full check:

```ts
import {
  validateDocument,
  replayEvents,
  type AlistigoDocument,
} from "@alistigo/document-format";

async function fullyValidate(input: unknown): Promise<{ ok: true } | { ok: false; reason: string }> {
  // ── Layer 1
  const schemaResult = await validateDocument(input);
  if (!schemaResult.valid) {
    return { ok: false, reason: `schema: ${schemaResult.errors.join("; ")}` };
  }
  const doc = input as AlistigoDocument;

  // ── Cross-section integrity (cheap structural checks beyond the schema)
  for (const event of doc.eventLog ?? []) {
    if (event.listId !== doc.meta.listId) {
      return { ok: false, reason: `event ${event["@id"]} has listId mismatching meta.listId` };
    }
  }

  // ── Layer 2 (plugin schemas) — omitted in M1; see above

  // ── Layer 3 (replay equivalence)
  const presence = doc.meta.eventLog.presence;
  if (presence === "full") {
    const replayed = replayEvents(doc.eventLog ?? []);
    if (!projectionsEqual(replayed, doc.projection)) {
      return { ok: false, reason: "replay of event log does not match projection" };
    }
  } else if (presence === "truncated") {
    // We do not have the projection-at-firstSeq baseline in the document, so we
    // can only check that the surviving events are well-formed and that the
    // projection has at least the items added since firstSeq. A stricter check
    // requires the runtime to keep the truncation baseline as a snapshot.
    if (!firstSeqMatchesLogStart(doc)) {
      return { ok: false, reason: "meta.eventLog.firstSeq does not match the first event's seq" };
    }
  }
  // presence === "absent" — nothing to replay; trust the projection.

  return { ok: true };
}

function projectionsEqual(a: AlistigoProjection, b: AlistigoProjection): boolean {
  // Multiset equality: same number of items, same multiset of (@id, name).
  // (Position is renumbered by the projector; we don't compare positions.)
  if (a.itemListElement.length !== b.itemListElement.length) return false;
  const keyOf = (li: AlistigoListItem) => `${li.item["@id"]}::${li.item.name}`;
  const ma = a.itemListElement.map(keyOf).sort();
  const mb = b.itemListElement.map(keyOf).sort();
  return ma.every((k, i) => k === mb[i]);
}

function firstSeqMatchesLogStart(doc: AlistigoDocument): boolean {
  if (doc.meta.eventLog.presence !== "truncated") return true;
  const events = doc.eventLog ?? [];
  if (events.length === 0) return false;
  return events[0].seq === doc.meta.eventLog.firstSeq;
}
```

The `replayEvents()` helper (in [`src/validate.ts`](../src/validate.ts)) handles each event type:

- `ListCreated` → genesis, no projection mutation
- `ElementAdded` → append `{ @type: "Thing", @id, name: text }` and renumber
- `ElementDeleted` → remove by `elementId`, renumber positions to be contiguous 1..N
- `ListRenamed` → noop on the projection (the rename lives in `meta.name`)

Unknown `eventType` throws. Unknown `elementId` in `ElementDeleted` throws.

---

## Validating events on their own

Sometimes you just want to validate one event (e.g. before appending it to the local log). The schema's `$defs.Event` is a complete event schema in itself:

```ts
import Ajv from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { documentSchema } from "@alistigo/document-format";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateEvent = ajv.compile({ ...documentSchema.$defs.Event, $id: "alistigo-event" });

if (!validateEvent(someEvent)) {
  console.error(validateEvent.errors);
}
```

Same pattern works for validating a `Projection` or a `Meta` block in isolation — point Ajv at `documentSchema.$defs.Projection` / `documentSchema.$defs.Meta`.

---

## Common failure modes (and which layer catches them)

| Bug | Caught by | Symptom |
|-----|-----------|---------|
| Missing required field (`@id`, `formatVersion`, …) | Layer 1 | `… must have required property '…'` |
| Wrong type (`seq` is a string) | Layer 1 | `… must be integer` |
| Unknown `eventType` | Layer 1 | enum mismatch |
| Plugin field without declaring the plugin in `meta.plugins` | Layer 2 | `unevaluated property` after composing plugin schemas |
| Event log seq not starting at 0 (when `presence: full`) | Layer 3 | `replayEvents` throws contiguity error |
| Mid-log event removed | Layer 3 | replay produces a different projection from the one shipped |
| Projection out of sync with log (e.g. an item added but no event for it) | Layer 3 | `projectionsEqual` returns false |
| `event.listId` ≠ `meta.listId` | cross-section integrity | "listId mismatch" |
| `firstSeq` declared but first surviving event has a different seq | cross-section integrity | "firstSeq does not match log start" |

---

## Testing strategy

For each `.feature` scenario in `@alistigo/features`, the runner should:

1. Drive the Application layer (commands → events).
2. Read back the resulting Document.
3. Run `fullyValidate()` on it.

That makes "the document at the end of every scenario validates against all three layers" part of the milestone Definition of Done.
