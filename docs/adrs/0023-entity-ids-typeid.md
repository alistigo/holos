---
status: accepted
date: 2026-08-20
deciders: Mikael Labrut
---

# ADR 0023 — Entity IDs: TypeID as the Preferred Format

**Status:** Accepted
**Date:** 2026-08-20

## Context

Every entity in the Alistigo domain model requires a unique, stable identifier — lists, list elements, events, actors, and users. At the time of the `list-document` format design, a choice was made to use TypeID (from the `typeid-js` library) for all IDs. That decision was never written down. This ADR captures it retroactively and extends it to all future entities.

Requirements for IDs in this project:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Globally unique without a central coordinator | P1 |
| R2 | Self-describing — an ID encodes what kind of entity it identifies | P1 |
| R3 | Type-safe — passing a ListId where an ActorId is expected is a compile-time error | P1 |
| R4 | Lexicographically sortable by creation time (avoids random index fragmentation) | P2 |
| R5 | URL-safe and human-readable in logs and storage keys | P2 |
| R6 | Works in the browser with no server coordination | P1 |
| R7 | Small dependency footprint | P2 |

## Decision

All entity IDs use **TypeID** from the [`typeid-js`](https://github.com/jetify-com/typeid-js) library (v1.x). Each entity type registers a unique lowercase string prefix. IDs are stored and transmitted as their string representation (`prefix_<base32-uuid7>`).

### Registered prefixes

| Prefix | Type | Package |
|--------|------|---------|
| `lst` | ListId | `@alistigo/list-domain` |
| `lse` | ListElementId | `@alistigo/list-domain` |
| `lev` | ListEventId | `@alistigo/list-domain` |
| `act` | ActorId | `@alistigo/list-domain` |
| `usr` | UserId | `@alistigo/artifact-user-plugin` |

New entity types must claim a prefix in this table before shipping.

### ID generation pattern

```ts
import { TypeID, typeid } from "typeid-js";

export type UserId = TypeID<"usr">;

export function generateUserId(): UserId {
  return typeid("usr");
}

export function parseUserId(str: string): UserId {
  return TypeID.fromString(str, "usr");
}
```

IDs are serialized via `.toString()` for storage and JSON transport, and deserialized via `TypeID.fromString(str, prefix)`.

## Rationale

| Criterion | Plain UUID (v4) | ULID | nanoid | **TypeID (chosen)** |
|-----------|----------------|------|--------|---------------------|
| Self-describing prefix | No | No | No | **Yes** |
| TypeScript type safety | No | No | No | **Yes** — generics |
| Lexicographic sort by time | No | Yes | No | **Yes** (UUIDv7 base) |
| URL-safe encoding | Hyphens | Yes | Yes | **Yes** (base32) |
| Works in browser | Yes | Yes | Yes | **Yes** |
| Spec compliance | RFC 4122 | ULID spec | — | TypeID spec |
| Bundle size | 0 (built-in) | ~3 KB | ~1 KB | ~8 KB |

The decisive factors are R2 and R3: without a self-describing prefix, there is no way to look at an ID string and know what entity it belongs to. Without TypeScript generics, a `ListId` and an `ActorId` are indistinguishable at compile time — bugs like passing an element ID as a list ID become invisible to the type checker.

UUIDv7 as the underlying random source gives k-sortable IDs (R4) that do not fragment index structures the way random UUIDv4 does.

The extra ~8 KB over a bare UUID approach is accepted; all other Alistigo dependencies are far larger.

## Consequences

**Positive:**
- A `TypeID<"usr">` cannot be passed where a `TypeID<"lst">` is expected — ID mix-ups are compile errors
- Log output is immediately interpretable: `usr_01arZ3v…` vs `lst_01arZ3v…`
- IDs sort chronologically, which simplifies debug output and event log ordering
- Any new package that needs an entity type just claims a prefix here and follows the pattern

**Negative / tradeoffs accepted:**
- TypeID strings (`usr_01arZ3vDWGXSMBTPCJNMDQSKBR`) are longer than raw UUIDs — 31 chars vs 36 — but more readable
- `typeid-js` is an additional dependency for every package that generates IDs
- TypeID validation (prefix check) must happen at deserialization boundaries; callers that pass raw UUIDs will throw

## Alternatives considered

- **Plain UUID v4** — rejected: opaque, no prefix, no time-ordering, no type safety (R2, R3, R4 all fail)
- **ULID** — rejected: time-sortable and URL-safe but no self-describing prefix and no TypeScript generics (R2, R3 fail)
- **nanoid** — rejected: compact but random, no prefix, no sorting, no type safety (R2, R3, R4 all fail)
- **Custom string format (`lst-<uuid>`)** — rejected: we would have to write the prefix-validation and type-safety layer ourselves; TypeID already provides it
