# Value Objects — Core List Context

All Value Objects are **immutable**. Equality is attribute-based, not reference-based.

> ID value objects (`ListId`, `ListElementId`, `ListEventId`, `ActorId`) are defined in [glossary.md](../glossary.md) alongside the Identifier Format spec.

---

## ListElementContent

| Property | Value |
|---|---|
| Underlying type | `string` |
| Validation | Non-empty after whitespace trimming; max 2000 characters (M1) |
| Equality | String equality on the trimmed value |

Replacing the content of a ListElement means creating a new `ListElementContent` — the value is not mutated in place.

---

## Actor

| Property | Value |
|---|---|
| Underlying type | `'user' \| 'llm' \| 'host' \| 'system'` |
| `user` | A human interacting with the ListWidget |
| `llm` | An AI system (e.g. Claude) issuing a command |
| `host` | The embedding platform or application |
| `system` | Automated/internal process |

`Actor` describes the **role** of the party involved in a ListEvent. Every `ListEvent` carries an `ActorId`; the `Actor` role is resolved from it when needed. No anonymous mutations.

---

## ActorId

See [glossary.md — Identifier Format](../glossary.md) for the TypeID spec.

`ActorId` is a `TypeID<"act">` that identifies the **specific actor instance** — e.g. a particular user account or LLM session. Every `ActorCommand` (and therefore every `ActorListCommand`) carries an `ActorId`.

The `Actor` role and `ActorId` are complementary: `Actor` says *what kind* of party acted; `ActorId` says *which specific* party acted.

---

## Timestamp

| Property | Value |
|---|---|
| Underlying type | `string` (ISO 8601 UTC) |
| Example | `2026-05-14T10:00:00Z` |
| Validation | Must parse as a valid date |

---

## SchemaVersion

| Property | Value |
|---|---|
| Underlying type | `string` (semver) |
| Format | `MAJOR.MINOR.PATCH` |
| M1 value | `1.0.0` |

Stored in every `AlistigoDocument`. Used by `ListDocumentSerializer` to apply migrations when deserializing older documents.
