# Core List Context — Overview

**Type:** Core Domain

The heart of Alistigo. Owns the `List` aggregate, all ListElements, all ListEvents, and all ActorCommands. The only bounded context that contains business logic.

---

## Responsibility

- Maintain the ordered collection of ListElements with enforced invariants
- Accept or reject ActorCommands and emit ListEvents
- Project the current ListProjection from the ListEventLog
- Expose a ListRepository interface for persistence

## Contents

| Document | What it covers |
|---|---|
| [aggregate.md](aggregate.md) | List aggregate root — identity, state, invariants, factory |
| [list-element.md](list-element.md) | ListElement entity |
| [value-objects.md](value-objects.md) | ListElementContent, Actor, Timestamp, SchemaVersion |
| [events.md](events.md) | ListCreated, ListElementAdded, ListElementDeleted, ListExported |
| [commands.md](commands.md) | ActorListCommand + AddListElement, DeleteListElement, ExportListDocument |
| [repository.md](repository.md) | ListRepository interface |
| [domain-services.md](domain-services.md) | ListProjector |
| [application-service.md](application-service.md) | ListApplicationService |

## Relationships

- **→ Document Context:** publishes ListProjection + ListEventLog as an `AlistigoDocument` via `ListDocumentSerializer`
- **← ListWidget:** receives ActorCommands from UI gestures (routed through ListApplicationService)
- **← LocalStorageListRepository:** infrastructure implementation of ListRepository (M1)
