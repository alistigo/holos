# Domain Model — Alistigo AI (M1)

Entry point for the Alistigo domain model. Start with the [Ubiquitous Language Glossary](glossary.md), then navigate into the bounded context that interests you.

---

## Bounded Context Map

```
┌─────────────────────────────────────────────────┐
│  Core List Context  (Core Domain)               │
│                                                 │
│  List ──owns──▶ ListElement[]                   │
│  ActorCommand ──applied to──▶ List              │
│  List ──emits──▶ ListEvent[]                    │
│  ListEvent[] ──projected by──▶ ListProjection   │
└────────────────────────┬────────────────────────┘
                         │ ListDocument (Published Language)
                         ▼
┌─────────────────────────────────────────────────┐
│  Document Context  (Supporting Domain)          │
│                                                 │
│  ListProjection + ListEventLog ──serialised──▶  │
│    AlistigoDocument (JSON-LD / schema.org)      │
│  AlistigoDocument ──deserialised──▶             │
│    ListProjection + ListEventLog                │
└─────────────────────────────────────────────────┘
                         │ Integration Guide
                         ▼
┌─────────────────────────────────────────────────┐
│  AI Integration Context  (Generic Subdomain)    │
│                                                 │
│  llms.txt / MCP description                     │
│  Teaches AI how to produce an AlistigoDocument  │
│  and embed the ListWidget as a ListArtifact     │
└─────────────────────────────────────────────────┘
```

**Integration pattern:** Published Language — `AlistigoDocument` is the public, versioned format. The Document Context translates between it and internal domain objects via an Anticorruption Layer (`ListDocumentSerializer`).

---

## Navigation

### Cross-cutting

| Document | What it covers |
|---|---|
| [glossary.md](glossary.md) | Ubiquitous Language glossary + TypeID identifier format |

### Core List Context

| Document | What it covers |
|---|---|
| [core-list/index.md](core-list/index.md) | Context overview |
| [core-list/aggregate.md](core-list/aggregate.md) | List aggregate root |
| [core-list/list-element.md](core-list/list-element.md) | ListElement entity |
| [core-list/value-objects.md](core-list/value-objects.md) | ListElementContent, Actor, Timestamp, SchemaVersion |
| [core-list/events.md](core-list/events.md) | ListCreated, ListElementAdded, ListElementDeleted, ListExported |
| [core-list/commands.md](core-list/commands.md) | ActorListCommand + subtypes |
| [core-list/repository.md](core-list/repository.md) | ListRepository interface |
| [core-list/domain-services.md](core-list/domain-services.md) | ListProjector |
| [core-list/application-service.md](core-list/application-service.md) | ListApplicationService |

### Document Context

| Document | What it covers |
|---|---|
| [document-context/index.md](document-context/index.md) | Context overview + AlistigoDocument JSON-LD format |
| [document-context/serializer.md](document-context/serializer.md) | ListDocumentSerializer (Anticorruption Layer) |

### AI Integration Context

| Document | What it covers |
|---|---|
| [ai-integration/index.md](ai-integration/index.md) | Context overview (placeholder) |

---

## Design Notes

- **Event sourcing light:** M1 does not use a full event store. The `ListEventLog` is embedded in the `ListDocument` and replayed on load. A `ListSnapshot` mechanism (M2+) can short-circuit replay for large lists.
- **No backend:** All persistence is via `LocalStorageListRepository` in M1. The `ListDocument` format is backend-ready — switching to remote storage requires only a new `ListRepository` implementation.
- **Single list per UserSession (M1):** The host page determines which `ListId` to load. Multi-list support is M2+.
- **Actor discipline:** Every mutation — including system-initiated ones — must carry an `ActorId`. This is enforced at the `ActorCommand` level. `CreateList` extends `ActorCommand` directly; all other list commands extend `ActorListCommand` which extends `ActorCommand`.
- **ListArtifact vs ListWidget:** `ListArtifact` is the AI's intent (a described `ListDocument`); `ListWidget` is the running interactive application. An AI produces a `ListArtifact`; the host page renders it as a `ListWidget`.
