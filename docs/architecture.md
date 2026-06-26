# Alistigo AI — Architecture

This document describes the technical architecture for Alistigo AI: stack, layering, runtime model, evolution path, and the non-negotiable principles that drive design choices.

---

## 1. Constraints

These come from the project vision and are **load-bearing** — most architectural choices follow from them.

| # | Constraint | Implication |
|---|------------|-------------|
| C1 | TypeScript everywhere | One language, shared types from document → app → runner |
| C2 | 100% frontend, no backend | All state lives in the browser. No network is required to run. |
| C3 | iframe-embeddable | The app is a self-contained bundle. Host integration is via `postMessage` only (M4+). |
| C4 | LLM-driven artifacts | Documents must be LLM-producible from prose, and human-readable when pretty-printed. |
| C5 | Client-first, sync later | Today: `localStorage` (and other browser storage). Tomorrow: optional sync to an API without changing the document format. |
| C6 | TDD via Gherkin | Every behavior is specified in a `.feature` file before code. A custom runner enforces that. |
| C7 | DDD: domain ⟂ rendering | Domain logic (list, item, plugin) does not import UI code. UI does not own state. |
| C8 | **Event sourcing + CQRS** | Mutations are **appended events**, never CRUD writes. The current document is a *projection* of the event stream. **At runtime**, the event log is the source of truth; the document is a derivable snapshot. (A Document arriving without a log — e.g. via URL fragment — is bootstrapped into the runtime by synthesizing a fresh log; from that point on, the log is authoritative.) |

---

## 2. Layered Model (DDD)

```
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                              │
│  - Iframe app (renders the list, dispatches user actions)        │
│  - Host demo page (M4)                                           │
│  - Gherkin runner harness                                        │
│  Imports: Application                                            │
└─────────────────────────▲────────────────────────────────────────┘
                          │
┌─────────────────────────┴────────────────────────────────────────┐
│  APPLICATION LAYER  (CQRS: command side ⟂ query side)            │
│                                                                  │
│  COMMANDS (write side — produce events):                         │
│  - CreateList, AddItem, ToggleItem, RemoveItem, RenameList       │
│  - A command handler validates the command against current state │
│    and emits one or more events. It NEVER mutates state directly.│
│                                                                  │
│  EVENTS (the only mutations that exist):                         │
│  - ListCreated, ItemAdded, ItemToggled, ItemRemoved, ListRenamed │
│  - Immutable, append-only, stable @id (UUIDv7)                   │
│                                                                  │
│  PROJECTOR (read side — folds events into a document):           │
│  - reduce(events: Event[]) → Document                            │
│  - Pure function. Same input ⇒ same output. Cacheable.           │
│                                                                  │
│  QUERIES (read side):                                            │
│  - LoadCurrentDocument, ExportDocument                           │
│  - Read from the projection (the current document snapshot).     │
│                                                                  │
│  Imports: Domain, Ports                                          │
└─────────────────────────▲────────────────────────────────────────┘
                          │
┌─────────────────────────┴────────────────────────────────────────┐
│  DOMAIN LAYER                                                    │
│  - Entities: List, ListItem                                      │
│  - Value objects: ItemId, ListId, ActionStatus                   │
│  - Event types & Command types (the domain language)             │
│  - Plugins as domain extensions (M2+)                            │
│  - Pure: no IO, no DOM, no global state                          │
│  Imports: nothing project-internal                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  PORTS  (interfaces declared in Application)                     │
│  - EventStore.append(events) / readAll() / readSince(seq)        │
│  - SnapshotStore.load() / save()    (optional cache, M2+)        │
│  - DocumentSerializer.parse() / stringify()                      │
│  - DocumentValidator.validate()                                  │
│  - EventValidator.validate()                                     │
│  - HostBridge.send() / on() (M4+)                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ADAPTERS  (implementations of Ports)                            │
│  - LocalStorageEventStore  (event log → localStorage)            │
│  - InMemoryEventStore      (used by the runner and tests)        │
│  - JsonLdSerializer        (uses packages/alistigo-document-format)     │
│  - AjvValidator            (uses packages/alistigo-document-format)     │
│  - PostMessageHostBridge   (M4+)                                 │
│  - HttpSyncEventStore      (post-1.0 — sync events to backend)   │
└──────────────────────────────────────────────────────────────────┘
```

**Rules of dependency:**
- Domain has zero project-internal imports.
- Application depends only on Domain + Ports (interfaces it owns).
- Adapters and Presentation depend on Application + Ports.
- Inversion: Application never imports an adapter — it receives one.

This makes the runner trivial: the same Application + Domain code runs against an `InMemoryEventStore` in tests and a `LocalStorageEventStore` in the browser. Replaying events is identical in both worlds.

**The CQRS contract in one sentence:** the only way to change state is to append an event to the event store; the only way to read state is to ask the projector to fold the event stream into the current document.

---

## 3. Workspace Layout

Implementation will be split across the monorepo so layers stay separable:

```
apps/
└── alistigo-artifact-playground/   # the iframe app (Vite + React)
    ├── src/
    │   ├── presentation/          # UI components only — no domain logic
    │   ├── adapters/              # localStorage, postMessage, …
    │   ├── boot.ts                # wires Application + adapters
    │   └── main.tsx
    ├── fixtures/                  # sample documents
    └── index.html                 # iframe entry

apps/
└── alistigo-host-demo/            # M4: reference host page

packages/
├── alistigo-document-format/      # PURE — no DOM, no browser APIs
│   ├── src/
│   │   ├── schema.json            # JSON Schema for the document (projection)
│   │   ├── event-schema.json      # JSON Schema for events
│   │   ├── types.ts               # TS types: Document, Event, Command
│   │   ├── parse.ts               # parse + validate (document & event)
│   │   └── serialize.ts
│   └── README.md
├── alistigo-domain/               # PURE — entities, value objects, event/command types
├── alistigo-document-editor/          # PURE — command handlers, projector, queries, ports
├── alistigo-plugin-api/           # M2 — plugin interface (events + projection contributions)
├── alistigo-plugin-checkbox/      # M2
├── alistigo-host-protocol/        # M4 — postMessage envelope + types
├── alistigo-features/             # PURE — Gherkin .feature specs + tag taxonomy + tooling
└── alistigo-features-runner/               # the Gherkin runner (see §7)
```

Each package follows the standard repo conventions (Nx `project.json`, `tsconfig.json` extending `tsconfig.base.json`, Bun runtime, Biome lint, `workspace:*` for cross-references).

---

## 4. Runtime Model

### 4.1 Iframe loading

The app is served as a static bundle. It loads in three phases:

1. **Boot** — read configuration from URL fragment / search params (the document, theme hint, allowed origins).
2. **Hydrate** — call `DocumentRepository.load()`. Order of preference:
   1. document supplied via `postMessage` from the host (M4+),
   2. document encoded in the URL fragment (`#doc=<base64-json>`),
   3. document found in `localStorage` under a deterministic key (per `@id`),
   4. an empty list document conforming to the schema.
3. **Render** — Presentation subscribes to Application state and dispatches user commands back.

### 4.2 Persistence

We persist **events**, not documents. The document is recomputed (or restored from a snapshot cache) when needed.

- **M1**: `LocalStorageEventStore` — append-only event log keyed by list `@id`. Each event is a separate entry under `alistigo:evt:<list-id>:<seq>` (or a single JSON array — TBD on the M1 spike). Whole-list event read on boot is fine for small lists.
- **M3+**: `IndexedDBEventStore` for larger event logs (image plugin, long-lived lists).
- **post-1.0**: `HttpSyncEventStore` — pushes new local events to a backend, pulls remote events, merges by stable event `@id` + Lamport clock. Append-only logs make this comparatively painless.

A **snapshot cache** (current document) MAY be persisted alongside the log so boot is fast for long lists, but it is *always* invalidatable: if the snapshot is missing or stale, replay the log.

The persistence layer is just an `EventStore` adapter — domain & application layers stay untouched.

### 4.3 Host integration (M4)

A versioned `postMessage` envelope, schema lives in `packages/alistigo-host-protocol/`. Aligned with the event-sourced model, the host can:

- push a new event (`alistigo:event` — gets appended to the local log),
- push a full event stream replacement (`alistigo:replay`),
- subscribe to events emitted by the widget (`alistigo:emitted`),
- request the current document snapshot (`alistigo:snapshot`).

The widget refuses messages from unallowed origins and validates every payload (event or snapshot) against its schema. Failure modes are explicit: invalid events are rejected (not partially applied), invalid documents render an error pane, not a half-broken UI.

---

## 5. Event Sourcing & CQRS

This is the methodology that drives every mutation in the system. Read it once; it explains a lot of the surface area above.

### 5.1 The contract

The contract holds **at runtime** — once the app has booted and an event log exists in the runtime. The "Bootstrap from a Document" subsection below covers the import case, where a Document arrives without a log.

- **At runtime, events are the only facts.** Anything that changes the list is captured as an event. The event log is append-only and immutable. Events are never edited or deleted, ever.
- **Commands are intent.** A command (`AddItem`, `ToggleItem`, `RemoveItem`, …) is a request to mutate. A command handler accepts it, validates it against the current state, and either rejects it or **emits one or more events**. Handlers never mutate state directly.
- **The document is a projection.** The current document is `reduce(events, initial)` — a pure function of the event log. Same events ⇒ same document, every time, on every machine.
- **Reads use the projection; writes use commands.** That's CQRS: the read side is separate from the write side. The projection can be cached (snapshot) without affecting correctness, because at runtime the log is the source of truth.

#### Bootstrap from a Document

A Document can arrive without an event log — e.g. an LLM produces one and hands it to the iframe via URL fragment, or a user pastes a fixture from somewhere else. In that case the runtime:

1. Validates the Document against the schema.
2. Synthesizes a fresh event log from it: one `ListCreated` event followed by one `ItemAdded` event per Element (in document order).
3. Treats that synthesized log as the source of truth from then on.

So at any point during runtime, an event log is present and authoritative; the imported Document only seeds it. (See [the format spec, §6 versioning & evolution](../../packages/alistigo-document-format/docs/spec.md#6-versioning--evolution) for the migration variant of this flow.)

```
Command ──▶ CommandHandler ──▶ Event(s) ──▶ append to EventStore
                                                  │
                                                  ▼
                                            Projector folds
                                                  │
                                                  ▼
                                         Document (projection)
                                                  │
                                                  ▼
                                            UI / queries
```

### 5.2 Event types (M1)

Each event is a typed record. The discriminator is `eventType`. Common envelope:

| Field | Type | Notes |
|-------|------|-------|
| `@id` | UUIDv7 URN | Globally unique, sortable |
| `eventType` | string enum | Discriminator |
| `listId` | UUIDv7 URN | The list this event belongs to |
| `occurredAt` | RFC 3339 timestamp | When the user / agent issued the event |
| `seq` | integer ≥ 0 | Per-list monotonic sequence number assigned on append |
| `agent` | `"user"` \| `"ai"` \| `"host"` \| `"system"` | Who emitted it |
| `payload` | event-type-specific | The data that defines what changed |

M1 catalog:

| Event | Emitted by command | Payload |
|-------|--------------------|---------|
| `ListCreated` | `CreateList` (implicit on first boot) | `name`, `listType`, `formatVersion` |
| `ItemAdded` | `AddItem` | `itemId` (UUIDv7), `name`, `position` |
| `ItemToggled` | `ToggleItem` | `itemId`, `newStatus` (`PotentialActionStatus` \| `CompletedActionStatus`) |
| `ItemRemoved` | `RemoveItem` | `itemId` |
| `ListRenamed` | `RenameList` | `name` |

The full schema for events lives in [the format spec, §4 The eventLog section](../../packages/alistigo-document-format/docs/spec.md#4-the-eventlog-section).

### 5.3 The projector

A pure function in `packages/alistigo-document-editor/`:

```ts
function project(events: AlistigoEvent[]): AlistigoDocument {
  return events.reduce(applyEvent, EMPTY_DOCUMENT);
}
```

Properties we hold:
- **Determinism**: same input ⇒ same output, no time-of-day, no random.
- **Totality**: every event in the catalog has an `applyEvent` branch. An unknown event type is a hard error (fast fail).
- **Order preservation**: events apply in `seq` order, not in insertion order. This makes future sync (events arriving out-of-order) trivially reorderable.
- **Plugin contributions** (M2+): plugins register additional event types and corresponding `applyEvent` branches via the plugin API.

### 5.4 What CQRS / Event Sourcing buys us

| Benefit | How it shows up |
|---------|------------------|
| **Audit log for free** | The event log *is* the audit log — we know what happened, when, by whom. Useful for "what did the AI just do to my list?" UIs. |
| **Time travel / undo** | Undo = "drop the last event" (or, more precisely, append a compensating event). Trivial to implement on top of the log. |
| **Sync-friendly** | Events have stable IDs and sequence numbers. Two clients merge by union-and-sort. CRDT-adjacent without an explicit CRDT in M1. |
| **AI-friendly** | An LLM can describe what it wants ("add three items, mark the second one done") as a command stream that the host translates into events. The widget never has to expose a CRUD surface to the AI. |
| **Testability** | Every test is "given these events, expect this document" — one of the cleanest tests you can write. |
| **Refactor safety** | The projection logic is pure; we can rewrite it without migrating data, because the data (events) is independent of the projection (document). |

### 5.5 Tradeoffs we are accepting

- **More moving parts than a CRUD model.** Events + commands + projector vs. just "edit the doc". For a small widget that's fine; for the project's goals (sync, undo, AI integration) it pays off quickly.
- **Replay cost grows with the log.** Mitigated by snapshots (M2+). A list realistically has hundreds, not millions, of events.
- **Schema migrations on events.** Events are immutable, so renaming an event type or changing its payload requires either an *upcaster* (transforms old events to the new shape on read) or a versioned event type. We document the policy in [the format spec, §8 event evolution policy](../../packages/alistigo-document-format/docs/spec.md#8-event-evolution-policy).

### 5.6 What we are *not* doing

- **Not an event bus.** No pub/sub between distant subsystems for now. Events are local; the only "bus" is the in-memory dispatcher inside the Application layer.
- **Not full DDD aggregates with optimistic concurrency.** A list is a single aggregate; we don't need version-vector concurrency control until M4+/sync.
- **Not a CRDT.** Append-only logs can pretend to be one for simple cases (sets, counters), but we explicitly do not build a generic CRDT layer in M1. We just don't paint ourselves into a corner.

---

## 6. Document Format

The list document is the **projection** — the current snapshot of the list, derivable at any time from the event log. It is a JSON-LD document built on schema.org `ItemList`, with an Alistigo extension namespace for properties schema.org doesn't cover.

The full spec — including JSON Schema for the document, examples, evolution / versioning rules, validation guidance, and references to schema.org and iCalendar VTODO (RFC 5545 / jCal RFC 7265) — lives in the dedicated package: [`packages/alistigo-document-format/`](../../packages/alistigo-document-format/) (start with [`docs/spec.md`](../../packages/alistigo-document-format/docs/spec.md)).

The `packages/alistigo-document-format/` package is the runtime expression of that spec: TS types (Document, Event, Command), JSON Schemas, `parse`, `validate`, `serialize`. **No other package re-implements the format.**

---

## 7. The Gherkin Runner

We follow TDD: behavior is written in `.feature` files first. The runner reads them and asserts the app conforms.

### 7.1 What the runner is

- A small TS package: `packages/alistigo-features-runner/`
- Built on top of an existing Gherkin parser (`@cucumber/gherkin` + `@cucumber/messages`) — we do **not** reimplement Gherkin parsing.
- Wires step definitions to the **Application layer directly** (commands in, events out, projection asserted) for fast, deterministic feedback.
- Optional Playwright bridge for end-to-end runs that drive the real iframe in a headless browser (used in CI before tagging a milestone done).

### 7.2 Why a custom runner instead of Cucumber-JS

- We want step definitions to operate on the **Application layer**, not on DOM selectors. Cucumber-JS works fine but a thin custom layer keeps step definitions tightly typed and lets the runner double as documentation.
- The runner can produce structured reports (which scenarios are green for which milestone), used by `README.md`'s progress table.
- It also lets us add event-aware steps cheaply: `Then the event log should contain an "ItemAdded" event with name "Buy bread"`.

### 7.3 Step vocabulary (sketch)

```
Given a "<list-type>" document with N items
Given the app is loaded with "<fixture-name>"
Given the event log contains:
  | eventType    | payload …                          |
  | ListCreated  | { "name": "Today", "listType": "todo" } |
  | ItemAdded    | { "name": "Buy bread", "position": 1 }  |

When the user adds an item "..."
When the user toggles item at position N
When the user reloads the page

Then the document should contain N items
Then item at position N should be "completed"
Then the event log should contain N events
Then the last event should be "<eventType>"
Then replaying the event log should produce a document equal to fixture "<name>"
Then the persisted document should validate against the JSON Schema
Then the exported document should validate against the JSON Schema
```

The full step library lives in `packages/alistigo-features-runner/src/steps/` and is documented in its own README.

### 7.4 Definition of done for any feature

A `.feature` is "implemented" when:
1. Every `Scenario` in it passes via the Application-level runner.
2. The same scenarios pass via the Playwright bridge (golden-path UI smoke).
3. The document at the end of the scenario validates against the JSON Schema.
4. The event log at the end of the scenario validates against the event JSON Schema, and replaying it reproduces the same document.

---

## 8. Tech Choices (subject to revisit before M1 implementation)

| Concern | Choice | Why |
|---------|--------|-----|
| Language | TypeScript (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) | Repo standard |
| Build | Vite | Fast, minimal config, ESM-first, ideal for a small SPA |
| UI lib | **Preact** (default) — revisit if M1 needs heavier ergonomics | Tiny bundle, React-API compatible, good for an iframe widget where size matters |
| State | Signals (`@preact/signals`) | Fine-grained reactivity, no Redux ceremony, plays well with command-driven Application layer |
| Validation | Ajv 2020 | Fast, strict JSON Schema validator, supports `$dynamicRef` for plugin extensions |
| Tests | Vitest (unit), Playwright (e2e bridge for the runner) | Repo-standard runners |
| Lint | Biome | Repo standard |
| Runtime | Bun (dev/build); browser at runtime | Repo standard |

A decision to swap any of these is recorded in [notes.md](notes.md) with rationale.

---

## 9. Evolution Path (sync, multiplayer, persistence)

The "client-first, sync later" promise dictates a few up-front choices, and event sourcing makes most of them straightforward:

- **Stable, content-addressable IDs.** Every `@id` (events, items, lists) is a UUIDv7 — globally unique, sortable, immutable. A future sync layer never has to reconcile renames.
- **Append-only event log.** The natural sync substrate. Two clients merge by `(unionByEventId, sortBySeq+timestamp)`. No CRUD reconciliation, no last-writer-wins guesswork.
- **Idempotent events.** Appending the same event `@id` twice is a no-op. Safe under replay, retries, dedupe.
- **Lamport-style ordering.** Each event has a `seq` per list, plus `occurredAt`. For multi-client merges (post-1.0), promote `seq` to a Lamport timestamp; nothing else needs to change.
- **CRDT-friendly without being a CRDT.** The event log + projector pattern composes cleanly with Yjs / Automerge if we ever need real multiplayer. We do **not** add a CRDT in M1; we just don't paint ourselves into a corner.
- **At runtime, snapshots are caches and the event log is authoritative.** This means the document format can evolve via projector changes without migrating stored state — only the events have to migrate. (Documents that arrive without a log seed a fresh runtime log; see §5.1 "Bootstrap from a Document".)

---

## 10. Non-Goals

- A backend. Ever required for the widget to function.
- Authentication. The widget is contextually authenticated by its host.
- A general-purpose "structured artifact" framework. Alistigo is *lists*; if you want tables or kanban, those are different artifacts with different documents.
- Server-side rendering. The widget is interactive-first.
- A general event bus / pub-sub system. Events are local to the Application layer.
- A full DDD aggregate model with optimistic concurrency. One list = one aggregate, single-writer for now.

---

## 12. Artifact Contract — Config-Doc & State-Doc

*Added in M2. Required reading before authoring a new `@alistigo` artifact.*

Every Alistigo artifact operates on exactly two documents. These are separate concerns by design: a host may change config without touching state, and state is preserved across config changes.

| Document | Purpose | Author | Lifetime |
|----------|---------|--------|---------|
| **Config document** | How the artifact should behave | Host (Claude, playground, app) | Per-load |
| **State document** | What the artifact contains | Artifact + user actions | Persisted |

### 12.1 Config Document

The config document tells the artifact *how* to behave. It is supplied by the host and **read-only inside the artifact** — the artifact must never mutate it.

**Minimum schema** (base fields, required for all artifacts):

```json
{
  "app": "@alistigo/artifact-list",
  "lang": "en"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `app` | string | yes | Artifact package name — discriminator for the config type |
| `lang` | BCP-47 string | no | Locale for UI text. Defaults to `"en"`. |

Artifact-specific extensions are validated by the leaf config package (e.g., `@alistigo/artifact-config-list-format` adds `readonly?: boolean`).

**Delivery mechanisms** (the artifact must accept all three, falling back in order):

1. **URL search params** — `?app=@alistigo/artifact-list&lang=en&readonly=false` — primary in M2 dev playground
2. **DOM element** — `<script type="application/json" id="alistigo-config">{ … }</script>` — production embeds and Claude artifacts
3. **postMessage** — `{ type: "alistigo:config", payload: { … } }` — M5+, dynamic host-to-artifact config push

### 12.2 State Document

The state document is the artifact's persistent data. For the list artifact this is the Alistigo event log + projection (see §5 and §6).

**Characteristics:**
- **Owned by the artifact** — the host supplies an initial state (or none), then the artifact manages it
- **Persisted in localStorage** (M1/M2) — keyed by list `@id`
- **Exported via postMessage** on request (M5+)
- **Round-trippable** — exporting and re-importing must reproduce exactly the same artifact state
- **Version-stamped** — carries a `schemaVersion` field for migration compatibility

**Load priority at boot** (highest → lowest):

1. State pushed via `postMessage` from the host (M5+)
2. URL fragment `#doc=<base64-json>` (link sharing)
3. localStorage — key derived from `@id`
4. Empty default document

**Round-trippability requirement:**
```
export(artifact_after_actions) → stateDoc
import(stateDoc)               → artifact_in_identical_state
```

Every artifact must guarantee this invariant. The Gherkin `@capability:persistence` scenarios enforce it end-to-end.

**Version-stamp requirement:** both documents carry a version field:
- Config: `configVersion` field (optional in M2, required in M3+)
- State: `alistigo:schemaVersion` (required from M1)

### 12.3 Package Dependency Graph

The config format system follows a strict leaf → aggregate → manager hierarchy:

```
@alistigo/artifact-config-list-format   (leaf — list-specific fields: readonly)
          ↑ imported by
@alistigo/artifact-config-format        (aggregate — discriminated union; base + all leaf schemas)
          ↑ used by
@alistigo/artifact-manager              (resolves CDN URL; injects <script> for artifact UMD)
          ↑ used by
apps/alistigo-artifact-playground       (dev harness; passes config via URL params to iframe)
```

**Rules:**
- Leaf packages **never** import `@alistigo/artifact-config-format` or any sibling leaf
- Adding a new artifact: create a leaf → add as dep of `artifact-config-format` → add an `if/then` branch to its discriminated union schema
- Consumers import only the aggregate (`artifact-config-format`) for validation, not leaves directly

### 12.4 Example: List Artifact Config + State

**Config document** (passed via URL params or `#alistigo-config` DOM element):

```json
{
  "app": "@alistigo/artifact-list",
  "lang": "en",
  "readonly": false
}
```

**State document** (list projection + event log, persisted in localStorage):

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "alistigo": "https://alistigo.ai/vocab/"
  },
  "@type": "ItemList",
  "alistigo:listId": "lst_01jx2kp9000000000000000001",
  "alistigo:schemaVersion": "1.0.0",
  "itemListElement": [
    {
      "@type": "ListItem",
      "alistigo:itemId": "itm_01jx2kpa000000000000000001",
      "name": "Buy bread",
      "alistigo:status": "PotentialActionStatus"
    }
  ],
  "alistigo:listEventLog": [
    {
      "alistigo:listEventId": "lev_01jx2kp8000000000000000001",
      "alistigo:eventType": "ListCreated",
      "alistigo:listId": "lst_01jx2kp9000000000000000001",
      "alistigo:actorId": "act_00000000000000000000000001",
      "alistigo:timestamp": "2026-06-01T10:00:00.000Z"
    },
    {
      "alistigo:listEventId": "lev_01jx2kpb000000000000000001",
      "alistigo:eventType": "ItemAdded",
      "alistigo:listId": "lst_01jx2kp9000000000000000001",
      "alistigo:actorId": "act_00000000000000000000000001",
      "alistigo:timestamp": "2026-06-01T10:01:00.000Z",
      "alistigo:itemId": "itm_01jx2kpa000000000000000001",
      "alistigo:itemName": "Buy bread"
    }
  ]
}
```

The config tells the artifact: "run in English, allow edits." The state tells the artifact: "your list has one item and here is its full event history." These are the only two external inputs an artifact needs to boot.

See [milestones.md](./milestones.md) for the M2 context in which this pattern was introduced.

---

## 11. Open Architectural Questions (track in notes.md)

- Preact vs. Solid vs. vanilla web components — measure bundle and DX before locking in.
- Do we ship the runner as a separate binary (`alistigo-features-runner features/`) or as a Vitest plugin?
- Conflict-resolution strategy when both a local event log and a host-pushed event stream exist on boot — host wins, local-events-not-yet-on-host get re-applied on top?
- How "live" is the document file alongside the app? In M1 the doc is the projection — what we hand to LLMs as a fixture is the *projection* (easy for them to reason about) but internally we replay events to produce it. Do we also ship example *event logs* alongside example documents in `fixtures/`?
- Snapshot caching: when do we write a snapshot vs. always replay? Likely a heuristic ("every N events" or "if replay > 50ms").
- Event upcasting vs. versioned event types when we change a payload shape — pick one and stick with it (see [the format spec, §8](../../packages/alistigo-document-format/docs/spec.md#8-event-evolution-policy)).
