# Ubiquitous Language Glossary — Alistigo AI

The authoritative vocabulary for this project. All code, tests, and documentation must use these terms exactly.

---

## Terms

| Term | Definition |
|------|------------|
| **List** | The aggregate root — an ordered collection of ListElements with a stable identity. The primary artifact Alistigo produces. |
| **ListElement** | A single entity in a List. Has a stable identity independent of its content. |
| **ListArtifact** | A list widget produced by an AI — the result of an AI issuing an `ActorCommand` with the intent of giving the user a list to interact with. The AI describes a `ListDocument`; Alistigo turns it into an interactive `ListWidget`. |
| **ListWidget** | The Alistigo list application embedded inside a host page (iframe or web component). Renders a List from a `ListDocument` and handles user interactions. |
| **ListId** | Globally unique, stable identifier for a List. Assigned at creation; never changes. |
| **ListElementId** | Globally unique, stable identifier for a ListElement within a List. Assigned at add-time; never changes even if content is edited (M2+). |
| **ListElementContent** | The text content of a ListElement. A non-empty string. A Value Object — immutable; replacing content means replacing the value. |
| **Actor** | The actor of a party involved in a ListEvent, defined by its role: `user` (human), `llm` (AI), `host` (embedding platform), `system` (automated) and its `ActorId` |
| **ActorId** | Globally unique identifier for a specific actor instance — e.g. a particular user account or LLM session. A TypeID Value Object (`TypeID<"act">`). |
| **ActorCommand** | Abstract base for all commands in the system. Carries `actorId` — who is issuing the command. |
| **ActorListCommand** | Abstract base for all commands that operate on an existing List. Extends `ActorCommand` with `listId`. |
| **ListEvent** | An immutable fact that happened to the List. Carries `listEventId`, `listId`, `actorId`, and `timestamp`. |
| **ListError** | An error raised when a List command is rejected or an invariant is violated. Replaces the generic "DomainError" — scoped to the Core List Context. |
| **ListEventLog** | The append-only, ordered sequence of all ListEvents on a List. Stored in the ListDocument. Source of truth for all List state. |
| **ListProjection** | The current observable state of a List, derived deterministically by replaying its ListEventLog. Same log → same projection, always. |
| **ListDocument** | The serialized, shareable representation of a List — ListEventLog + ListProjection — expressed in JSON-LD using schema.org vocabulary. Consumed by AI systems and the ListWidget alike. |
| **UserSession** | A single browser tab's lifecycle. Persistence means the List survives a page reload within the same origin. |
| **ListSnapshot** | (M2+) A point-in-time ListProjection checkpoint to avoid full log replay on large lists. Out of scope for M1. |

---

## Identifier Format

All entity and event identifiers use the **TypeID** spec ([typeid-js](https://github.com/jetify-com/typeid-js)):

- Format: `<prefix>_<26-char base32 UUIDv7>` — e.g. `lst_01h2xcejqtf2nbrexx3vqjhp41`
- Lowercase 3-letter prefix + underscore + K-sortable suffix (UUIDv7 ms timestamp embedded)
- **K-sortable:** lexicographic order = creation-time order; no timestamp field needed to sort
- **Type-safe:** `TypeID<"lst">` is a distinct TypeScript type from `TypeID<"lse">` — the compiler rejects passing the wrong ID type to a function
- Generation: `typeid("lst")`, `typeid("lse")`, `typeid("lev")` from `typeid-js`
- Validation: `TypeID.fromString(str, "lst")` — throws on prefix mismatch or malformed suffix

| Identifier | Prefix | TypeScript type | Example |
|---|---|---|---|
| `ListId` | `lst` | `TypeID<"lst">` | `lst_01h2xcejqtf2nbrexx3vqjhp41` |
| `ListElementId` | `lse` | `TypeID<"lse">` | `lse_01h2xcejqtf2nbrexx3vqjhp41` |
| `ListEventId` | `lev` | `TypeID<"lev">` | `lev_01h2xcejqtf2nbrexx3vqjhp41` |
| `ActorId` | `act` | `TypeID<"act">` | `act_01h2xcejqtf2nbrexx3vqjhp41` |
