# Alistigo Document Format — Specification

The list document is the **transport format** for an Alistigo list. It is what gets stored on disk, exported, sent over the wire, embedded in URLs, and produced by an LLM.

Compared to earlier drafts, the document is now **self-contained**: a single JSON-LD object that bundles three sections — `meta`, `eventLog` (optional), and `projection` — into one shippable artifact. The runtime no longer juggles two parallel artifacts; it ships one.

> **At runtime, the source of truth is the event log** (when one is present). The projection is a derivable snapshot. See [`projects/alistigo-ai/architecture.md` §5](../../../projects/alistigo-ai/architecture.md#5-event-sourcing--cqrs) for the full event-sourcing contract and the bootstrap-from-Document path.

---

## 1. Anatomy

```
Document
├── @context             JSON-LD: schema.org + alistigo namespace
├── @type                "alistigo:Document"
├── meta                 identity + integrity descriptors (§3)
│   ├── listId           UUIDv7 — stable identity of the List
│   ├── formatVersion    SemVer of THIS format
│   ├── listType?        optional discriminator (default supplied at runtime)
│   ├── name?            optional human-readable name
│   ├── plugins?         plugins this document opts into
│   ├── dateCreated
│   ├── dateModified
│   └── eventLog         { presence: "full" | "truncated" | "absent", … }
├── eventLog?            the event log (§4) — present unless meta says "absent"
└── projection           current rendered state of the List (§5)
```

The three sections answer three different questions:

| Section | Answers | When you need it |
|---------|---------|-----------------|
| **`meta`** | "What is this document, when, by whom, and is its history complete?" | Always — every document carries one. |
| **`eventLog`** | "What happened, in what order, and who did it?" | When you need history (undo, audit, sync, replay). Can be omitted to shrink the document. |
| **`projection`** | "What does the list look like right now?" | Always — even an empty one. This is what gets rendered. |

---

## 2. Why this shape

| Goal | How the format meets it |
|------|--------------------------|
| Self-contained | One JSON object. No "see also" file. An LLM can hand it to the iframe with one URL fragment. |
| Semantic interop | Built on **schema.org** — `ItemList` for the projection, `Action` (when plugins add it) for completable items. Other tools recognize most of it. |
| Human-readable | JSON, indented. An LLM can hand-write one. A user can read it. |
| Evolutive | Versioned schema (§6). Plugins are namespaced (`alistigo:`). New fields are additive; breakers go through MAJOR with a documented migration. |
| Shrinkable | The eventLog can be truncated or wiped to fit budget constraints (§4.1). The projection alone is a valid (history-less) document. |
| Round-trippable when wanted | Full export = meta + eventLog + projection. Re-importing reproduces every state, including history. |

Why this format and not alternatives:

- **schema.org `ItemList` + `ListItem` + `Action`** for the projection — see the [archived rationale in the original spec](#10-references) (we keep using it; nothing changed there).
- **iCalendar VTODO (RFC 5545) / jCal (RFC 7265)** — referenced for plugin field naming when we add `priority`, `due`, `percentComplete`, but not adopted as the base format.

---

## 3. The `meta` section

`meta` carries the document's identity and integrity descriptors. It is required.

### Required fields

| Field | Type | Notes |
|-------|------|-------|
| `listId` | UUIDv7 URN | Stable identity of the List. Distinct from any per-document id. |
| `formatVersion` | SemVer | Of THIS document format. Drives migration. |
| `dateCreated` | RFC 3339 | When the List was created. |
| `dateModified` | RFC 3339 | When the projection was last refreshed. |
| `eventLog` | object | Integrity descriptor for the eventLog field — see §3.1. |

### Optional fields

| Field | Type | Notes |
|-------|------|-------|
| `listType` | string | Discriminator for plugin behavior. Runtime supplies `"list"` for the M1 base list. |
| `name` | string | Human-readable name. Not user-facing in M1. |
| `plugins` | string[] | Plugins this document opts into. |

### 3.1 `meta.eventLog` — integrity descriptor

The `meta.eventLog` object describes the *state* of the eventLog field. It is required even when the eventLog is absent — that's how we know it was deliberately removed and not just lost.

| Field | When required | Means |
|-------|---------------|-------|
| `presence` | always | One of `full` \| `truncated` \| `absent` |
| `firstSeq` | when `presence: truncated` | The `seq` of the oldest surviving event. Events with `seq < firstSeq` have been wiped. |
| `truncatedAt` | when `presence: truncated` | RFC 3339 timestamp of the truncation. |
| `truncatedReason` | optional | Free-form note (e.g. "reduce export size"). |
| `wipedAt` | when `presence: absent` | RFC 3339 timestamp of when the eventLog was discarded. |
| `wipedReason` | optional | Free-form note. |

The three states:

#### `presence: "full"`

The event log is complete: it starts at `seq = 0` and is contiguous through to the most recent event. Replaying every event reproduces the projection exactly.

```jsonc
"meta": {
  "listId": "urn:uuid:0190f5cc-7e2e-7a9a-9c61-0c5a8c0f0d11",
  "formatVersion": "1.0.0",
  "dateCreated": "2026-04-28T10:00:00Z",
  "dateModified": "2026-04-30T12:00:00Z",
  "eventLog": { "presence": "full" }
}
```

#### `presence: "truncated"`

Old events have been wiped to reduce size. Surviving events form a **contiguous prefix-truncated** sequence — i.e. they start at `firstSeq` and run contiguously to the most recent. The projection field represents the state **at truncation time**, before the surviving events; replaying the surviving events on top of the projection should reproduce the current state.

> **Rule:** mid-log deletes and edits are forbidden. Only prefix truncation is allowed. This preserves replay determinism for everything that survives.

```jsonc
"meta": {
  "eventLog": {
    "presence": "truncated",
    "firstSeq": 42,
    "truncatedAt": "2026-04-30T11:00:00Z",
    "truncatedReason": "reduce export size for chat UI"
  }
}
```

#### `presence: "absent"`

The eventLog field is omitted entirely. There is no replayable history. The projection is the only state available.

```jsonc
"meta": {
  "eventLog": {
    "presence": "absent",
    "wipedAt": "2026-04-30T11:00:00Z",
    "wipedReason": "privacy reset on user request"
  }
}
```

### 3.2 What you lose, by state

| State | Replay history | Audit trail | Undo | Sync after this point |
|-------|:--:|:--:|:--:|:--:|
| `full` | ✅ all of it | ✅ everything | ✅ to any prior state | ✅ trivially (events sync) |
| `truncated` | partial — only post-`firstSeq` | partial | only into the surviving range | yes, but pre-`firstSeq` is lost |
| `absent` | ❌ | ❌ | ❌ | the projection becomes the new baseline; sync starts from now |

Pick the smallest level that meets your needs. The default for new documents is `full`.

---

## 4. The `eventLog` section

When `meta.eventLog.presence` is `full` or `truncated`, this field is an **array of events**, each conforming to the Event schema (§4.2). Order is by `seq` (ascending, contiguous).

### 4.1 Truncation rules

- **Allowed:** prefix truncation — drop a contiguous range starting at `seq=0`, then update `meta.eventLog` to `{ presence: "truncated", firstSeq, truncatedAt }`.
- **Allowed:** full wipe — drop all events, set `meta.eventLog` to `{ presence: "absent", wipedAt }`. Any subsequent mutations restart the log from `seq = 0` *with a new `listId`* (a new logical history).
- **Forbidden:** removing an event from the middle of the log. The remaining events would still claim contiguous seq numbers but the projection would no longer match — replay determinism is broken. Validators MUST reject any non-contiguous log.
- **Forbidden:** editing the payload of any event in place. Events are immutable.

### 4.2 Event format

Common envelope:

| Field | Type | Notes |
|-------|------|-------|
| `@id` | UUIDv7 URN | Globally unique event id. |
| `@type` | const `"alistigo:Event"` | |
| `eventType` | enum | `ListCreated` \| `ElementAdded` \| `ElementDeleted` \| `ListRenamed` |
| `eventVersion` | SemVer | Versioning per event type — see §7. |
| `listId` | UUIDv7 URN | Must match `meta.listId`. |
| `seq` | int ≥ 0 | Per-list monotonic, contiguous. |
| `occurredAt` | RFC 3339 | When the event was emitted. |
| `agent` | enum | `user` \| `ai` \| `host` \| `system` |
| `payload` | object | Event-type-specific (below). |

#### M1 event catalog

| `eventType` | Payload required | Notes |
|-------------|------------------|-------|
| `ListCreated` | `formatVersion` | The genesis event. `name`, `listType`, `plugins` are optional. |
| `ElementAdded` | `elementId`, `text`, `position` | Append at `position`. |
| `ElementDeleted` | `elementId` | Remove by identity. |
| `ListRenamed` | `name` | Updates `meta.name`; does not affect the projection. |

### 4.3 Event invariants

A valid event log:

1. Begins with `ListCreated` at `seq = 0` *unless* `presence: "truncated"`, in which case it begins at `seq = firstSeq` with whatever event was active at that point.
2. `seq` is strictly increasing, contiguous, no gaps.
3. All events share the same `listId` (matching `meta.listId`).
4. `@id` is unique across all events.
5. **Causality**: `ElementDeleted` for an `elementId` that was never `ElementAdded` (or has already been deleted) is a projector-level error — validators flag it but JSON Schema cannot enforce it structurally.

---

## 5. The `projection` section

The current rendered state of the list. Always present.

```jsonc
"projection": {
  "@type": "ItemList",
  "itemListOrder": "https://schema.org/ItemListUnordered",
  "numberOfItems": 3,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "item": {
      "@type": "Thing",
      "@id": "urn:uuid:0190f5cc-…-1d6a8c0f0d12",
      "name": "Buy bread"
    }},
    { "@type": "ListItem", "position": 2, "item": {
      "@type": "Thing",
      "@id": "urn:uuid:0190f5cc-…-2e7a8c0f0d13",
      "name": "Pay electricity bill"
    }},
    { "@type": "ListItem", "position": 3, "item": {
      "@type": "Thing",
      "@id": "urn:uuid:0190f5cc-…-3f8a8c0f0d14",
      "name": "Buy bread"
    }}
  ]
}
```

The base list uses `@type: Thing` for items (text + id only). The `@type: Action` form arrives once the `checkbox-element` plugin (M2) is loaded — at which point the projection upgrades affected items from `Thing` to `Action` with an `actionStatus`.

Element 1 and 3 share the same `name` ("Buy bread") with distinct `@id`s — duplicates are explicitly allowed in the base list.

### 5.1 Projection ↔ event log invariants

When `meta.eventLog.presence` is `full`:

> `replayEvents(eventLog) === projection` (multiset equality on items, plus exact field equality elsewhere).

When `presence` is `truncated`:

> `replayEvents(eventLog, projection_at_firstSeq) === projection_now`. The runtime keeps the projection-at-truncation as a separate baseline if it needs full reproducibility; for transport, only the current projection is shipped (and that's lossy by design).

When `presence` is `absent`:

> No replay possible. The projection is taken as ground truth.

See [validation.md](validation.md) for executable pseudo-code.

---

## 6. Versioning & evolution

The format follows **SemVer**:

| Bump | Triggers |
|------|----------|
| **PATCH** (`1.0.x`) | Documentation-only fixes, examples, non-normative cleanups. |
| **MINOR** (`1.x.0`) | New optional fields, new enum values that consumers can ignore, new `alistigo:*` extensions, new plugin slots. **A v1.0.0 reader must read v1.x.0 documents successfully** (forward-compatible reads, ignoring fields it doesn't understand). |
| **MAJOR** (`x.0.0`) | Anything that breaks readers: removed fields, renamed fields, changed semantics, tightened validation. **Requires a migration function** in `src/migrations/`. |

Every document carries `meta.formatVersion`. The library:
1. Parses the JSON.
2. Detects `meta.formatVersion`.
3. If older than the library's known version, runs migrations forward.
4. Validates the migrated document against the current schema.

A document whose `formatVersion` is **newer** than the library is **read-only** — the library shows it but disables mutations.

---

## 7. Plugin extension pattern

A plugin extends the format in two ways:

**(a) Adds namespaced fields to items** (e.g. `alistigo:priority`, `alistigo:dueDate`).

**(b) Contributes a JSON Schema fragment** that describes those fields:

```json
{
  "$id": "https://alistigo.io/schema/v1/plugins/priority.json",
  "type": "object",
  "properties": {
    "alistigo:priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 9,
      "description": "1 = highest; mirrors VTODO PRIORITY (RFC 5545)."
    }
  }
}
```

At validation time the runtime composes the base schema with all plugin schemas listed in `meta.plugins`. A document that uses `alistigo:priority` without declaring `"priority"` in `meta.plugins` fails validation — that's intentional, it keeps documents self-describing.

---

## 8. Event evolution policy

Events are **immutable on disk**. We never edit a stored event. So we have a discipline for evolving event payloads.

Two patterns; pick one per change and document it in [`projects/alistigo-ai/notes.md`](../../../projects/alistigo-ai/notes.md). Mixing within the same event type is forbidden.

**(a) Upcasting** — bump `eventVersion`, write an *upcaster* that transforms `vX → vY` on read. The on-disk event is left alone; the projector sees the upcast version.

```
Stored:  { eventType: "ElementAdded", eventVersion: "1.0.0", payload: { text, position } }
Read:    upcast → { eventType: "ElementAdded", eventVersion: "1.1.0", payload: { text, position, addedBy: "unknown" } }
```

Use upcasting for:
- Adding optional fields with defaults
- Renaming fields (with mapping)
- Tightening enums when prior values can be mapped

**(b) Versioned event types** — introduce a *new* event type for the new shape; keep the old one alive. The projector handles both.

Use versioned types for:
- Splitting one event into multiple
- Changing semantics
- Anything where upcasting would be lossy

**The rule that applies regardless:** an unknown `eventType` or `eventVersion` is a hard error and disables mutations until the library is updated.

---

## 9. Producer guidance

### For LLMs

When asked to produce an Alistigo document:

1. Always emit a **complete, valid** document — `@context`, `@type`, `meta`, `projection`. The eventLog is optional; omit it (with `meta.eventLog.presence: "absent"`) for the smallest size.
2. Use **UUIDv7** for `meta.listId`, every `event.@id`, every `event.payload.elementId`, and every `item.@id`. Never reuse IDs across documents.
3. Set `meta.dateCreated` and `meta.dateModified` to the current time in ISO 8601 / RFC 3339 form.
4. If you produce an eventLog, ensure the seq numbers are contiguous and the events are causally consistent (every `ElementDeleted.elementId` was previously added).
5. Pretty-print with 2-space indent.

A minimal "history-less" document an LLM might produce:

```json
{
  "@context": ["https://schema.org", { "alistigo": "https://alistigo.io/ns/v1#" }],
  "@type": "alistigo:Document",
  "meta": {
    "listId": "urn:uuid:0190f5cc-7e2e-7a9a-9c61-0c5a8c0f0d11",
    "formatVersion": "1.0.0",
    "dateCreated": "2026-04-30T12:00:00Z",
    "dateModified": "2026-04-30T12:00:00Z",
    "eventLog": { "presence": "absent", "wipedAt": "2026-04-30T12:00:00Z", "wipedReason": "freshly generated by AI" }
  },
  "projection": {
    "@type": "ItemList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "item": {
        "@type": "Thing",
        "@id": "urn:uuid:0190f5cc-…-1d6a8c0f0d12",
        "name": "Buy bread"
      }}
    ]
  }
}
```

### For humans / consumers

- Treat unknown `alistigo:*` fields as opaque — preserve them on round-trip.
- Treat unknown enum values defensively (open enums can grow in MINOR bumps).
- **Validate before mutating**; never serialize a document the validator rejects. See [validation.md](validation.md).

---

## 10. References

- [schema.org `ItemList`](https://schema.org/ItemList)
- [schema.org `ListItem`](https://schema.org/ListItem)
- [schema.org `Action`](https://schema.org/Action)
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
- [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/schema)
- [RFC 5545 — iCalendar (VTODO)](https://www.rfc-editor.org/rfc/rfc5545)
- [RFC 7265 — jCal](https://www.rfc-editor.org/rfc/rfc7265)
- [RFC 9562 — UUIDv7](https://www.rfc-editor.org/rfc/rfc9562)
- [RFC 6902 — JSON Patch](https://www.rfc-editor.org/rfc/rfc6902)
