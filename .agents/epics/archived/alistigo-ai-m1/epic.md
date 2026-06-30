---
name: alistigo-ai-m1
status: completed
created: 2026-05-14T08:46:50Z
updated: 2026-05-29T13:51:58Z
progress: 100%
prd: .claude/prds/alistigo-ai-m1.md
github: https://github.com/MLKiiwy/europa/issues/56
---

# Epic: alistigo-ai-m1 — Base List Artifact

## Overview

Deliver a self-contained, embeddable list widget that AI can produce by describing a JSON-LD document rather than writing app code. M1 covers: render a list, add/delete text elements, persist across page reloads, and validate all behaviour via Gherkin acceptance scenarios.

Domain model reference: [`projects/alistigo-ai/domain/index.md`](../../../projects/alistigo-ai/domain/index.md)

## Architecture Decisions

- **Event-sourced document** — the `AlistigoDocument` embeds an Interaction Log (append-only event stream). The visible list state is a deterministic Projection over that log. Same document → same UI (satisfies N4).
- **No backend** — localStorage is the only persistence layer in M1. The `ListRepository` interface abstracts storage; swapping to remote requires only a new implementation.
- **JSON-LD / schema.org** — `ItemList` + `ListItem` for the public format. Custom Alistigo properties namespaced under `https://alistigo.ai/vocab/`. Readable by AI out of the box.
- **DDD layering** — Domain layer (entities, value objects, events, commands) has zero infrastructure dependencies. Application services orchestrate; infrastructure implements.
- **Acceptance-first** — Gherkin `.feature` files in `packages/alistigo-features/` are the definition of done. A milestone is complete only when all `@m1` scenarios pass green via the Playwright acceptance runner.

## Technical Approach

### Packages

| Package | Responsibility |
|---------|---------------|
| `packages/alistigo-domain` | TypeScript DDD model — List aggregate, entities, value objects, events, commands |
| `packages/alistigo-document-format` | `AlistigoDocument` JSON-LD schema, TypeScript types, validation, `DocumentSerializer` |
| `packages/alistigo-document-editor` | `ListApplicationService`, command handlers, `DocumentProjector` |
| `packages/alistigo-widget` | Embeddable web component — renders list, handles add/delete UI |
| `packages/alistigo-features` | Gherkin `.feature` files + acceptance runner + Playwright bridge |

### Data Flow

```
User gesture (click/type)
  → Command (AddElement / DeleteElement)
  → ListApplicationService
  → List.addElement() / List.deleteElement()
  → DomainEvent emitted
  → Interaction Log updated
  → DocumentProjector reprojects
  → Widget re-renders
  → LocalStorageListRepository.save(AlistigoDocument)
```

### Frontend Components

- `<alistigo-list>` — root web component; accepts a serialized `AlistigoDocument` attribute or a `ListId` for localStorage lookup
- `ElementList` — renders `Element[]` in insertion order
- `AddElementForm` — input + submit; dispatches `AddElement` command
- `ElementRow` — single element display with delete action

### Backend Services

None in M1. All logic runs client-side.

### Infrastructure

- `LocalStorageListRepository` — implements `ListRepository`; serializes via `DocumentSerializer`; keyed by `ListId`

## Implementation Strategy

Build inside-out following DDD layers:

1. **Domain core first** — types, aggregates, events, commands. No I/O; fully unit-testable.
2. **Document format** — JSON-LD shape, serializer, deserializer. Validates round-trip fidelity.
3. **Gherkin specs** — feature files define the exact acceptance contract before any widget code.
4. **Application service + projector** — wires domain to the outside world.
5. **Widget** — render layer; consumes application service.
6. **Persistence** — plug in localStorage repository.
7. **Acceptance runner** — Playwright + Gherkin runner closes the loop; all `@m1` scenarios green.
8. **AI integration guide** — `llms.txt` published alongside the widget.

Tasks 1 and 3 can run in parallel (domain types don't block writing feature files).

## Task Breakdown Preview

| # | Task | Parallel? | Depends on |
|---|------|-----------|------------|
| 001 | Domain core — TypeScript DDD model | yes | — |
| 002 | Document format — JSON-LD schema + serializer | no | 001 |
| 003 | Gherkin acceptance specs (@m1 scenarios) | yes (with 001) | — |
| 004 | Application service + DocumentProjector | no | 001, 002 |
| 005 | Widget — embeddable web component | no | 002, 004 |
| 006 | Persistence — LocalStorageListRepository | no | 002, 004, 005 |
| 007 | Acceptance runner — Playwright + Gherkin bridge | no | 003, 005, 006 |
| 008 | AI integration guide — llms.txt / MCP description | yes (after 002) | 002 |

## Dependencies

- `packages/alistigo-document-format/` — already scaffolded (verify and extend)
- `packages/alistigo-document-editor/` — already scaffolded (verify and extend)
- `packages/alistigo-features/` — Gherkin features package (may need scaffold)
- `packages/alistigo-domain/` — new package (scaffold with `new-package.sh`)
- `packages/alistigo-widget/` — new package (scaffold with `new-package.sh`)

## Success Criteria (Technical)

- All `@m1` Gherkin scenarios in `packages/alistigo-features/features/core/` pass green.
- `DocumentProjector.project(log)` is deterministic: replaying the same log always yields identical state.
- `DocumentSerializer.serialize → deserialize` round-trip produces an equivalent List.
- Widget renders in a real browser (Playwright screenshot or manual test): add + delete + reload preserves state.
- `AlistigoDocument` validates against the published JSON-LD schema.

## Estimated Effort

8 tasks, 3 parallel streams possible. Realistic wall-clock estimate: 2–3 focused working sessions.
