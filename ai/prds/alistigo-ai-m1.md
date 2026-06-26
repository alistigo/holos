---
name: alistigo-ai-m1
description: Base list artifact — a standard, reusable list widget that AI can produce and customize instead of building a list app from scratch every time
status: active
created: 2026-05-13T14:17:50Z
---

# PRD: alistigo-ai-m1 — Base List Artifact

## Executive Summary

Alistigo gives AI a standard, reusable list widget it can hand to users as an artifact — instead of generating a new ad-hoc list app from scratch each time. The first milestone delivers the base list: view, add, remove, and persist elements across sessions.

## Problem Statement

Today, when a user asks an AI to create a shareable list artifact, the AI writes a full application from scratch — picking a UI library, wiring state management, handling persistence. This has three problems:

1. **Token cost.** Writing an entire app takes a lot of tokens — for something as common as a list.
2. **Non-determinism.** Because AI is non-deterministic, every generated list app looks and behaves differently. There is no consistent user experience.
3. **Limited features.** A generated app only has what the AI happened to include. No shared feature baseline, no way to extend it.

Alistigo solves this by offering a **standard list artifact** the AI can produce by describing a document — not by writing an app. The AI stays in its lane (data and intent); Alistigo handles the rendering, interaction, and persistence. Future milestones let the AI customize the artifact via plugins and themes without touching the core.

## User Stories

User stories are defined as Gherkin scenarios in `packages/alistigo-features/`. All scenarios tagged `@m1` are in scope for this milestone.

**Location:** `packages/alistigo-features/features/core/`

| Feature file | What it covers |
|---|---|
| `display-list.feature` | Rendering an empty or populated list |
| `add-element.feature` | Appending a new text element |
| `delete-element.feature` | Removing an element by identity |
| `persist.feature` | State surviving a session reload |

A milestone is done when all `@m1` scenarios pass green via the acceptance runner and the Playwright bridge.

## Functional Requirements

| # | Requirement |
|---|-------------|
| F1 | An AI can produce a list by describing a document — no app code required |
| F2 | The widget renders the list and its elements |
| F3 | A user can add a text element to the list |
| F4 | A user can remove any element from the list |
| F5 | The list state persists across page reloads |
| F6 | A user or AI can export the current list as a document |
| F7 | An acceptance runner reads the Gherkin `.feature` files and validates all `@m1` scenarios programmatically |
| F8 | The list artifact can be shared to other users via the host AI chat's native artifact/widget sharing mechanism — the recipient gets the same document and can interact with it |
| F9 | The document format is JSON-LD, using schema.org types wherever they exist (e.g. `ItemList`, `ListItem`). Custom Alistigo properties extend the schema.org vocabulary rather than replacing it — no wheel reinvention |
| F10 | Alistigo publishes a machine-readable skill / integration guide (e.g. an `llms.txt`, an MCP tool description, or a structured prompt) that teaches any AI how to produce a valid Alistigo document and embed the widget. This guide is publicly hosted and web-discoverable so AI systems can ingest it. Once ingested, an AI asked to "create a list" should reach for Alistigo automatically — no custom prompt engineering required from the user |

## Non-Functional Requirements

| # | Requirement |
|---|-------------|
| N1 | The widget is embeddable — it runs as a self-contained unit inside a host page |
| N2 | No backend is required for any M1 feature |
| N3 | The document format is human-readable and LLM-producible from prose |
| N4 | The same document always produces the same list — deterministic rendering |
| N5 | The document contains a full interaction log recording every action (add, delete, rename, …) with the actor (`user`, `llm`, `host`, `system`) and a timestamp — so any party can reconstruct what happened and who did it |
| N6 | All entities and domain concepts (List, Element, Event, Command, …) are defined following Domain-Driven Design — bounded contexts, ubiquitous language, entities with stable identities, value objects for immutable data |

## Success Criteria

- All `@m1` Gherkin scenarios in `packages/alistigo-features/features/core/` pass green.
- The widget works in a real browser: add elements, delete elements, reload — state is preserved.
- The exported document is valid and can be used to reconstruct the list.

## Constraints & Assumptions

- M1 covers only text elements — no checkboxes, priorities, due dates, images, or categories.
- Element order is preserved but not user-sortable in M1.
- Duplicate elements (same text, different identity) are allowed.
- Single list per session in M1; multi-list support is deferred.

## Out of Scope

- Plugin system and specialised list types (todo, grocery, wishlist) — M2+
- AI customization via plugins or themes — M2+
- Host integration / communication protocol — M4
- Backend sync — post-1.0

## Dependencies

- `packages/alistigo-features/` — Gherkin acceptance specs
- `packages/alistigo-document-format/` — document schema and types (scaffolded)
- `packages/alistigo-document-editor/` — command handlers and projector (scaffolded)

## References

- Architecture constraints (C1–C8): [`projects/alistigo-ai/architecture.md`](../../projects/alistigo-ai/architecture.md)
- UI library & i18n stack (ADR 0001): [`projects/alistigo-ai/adrs/0001-ui-library.md`](../../projects/alistigo-ai/adrs/0001-ui-library.md)
- Domain ubiquitous language: [`projects/alistigo-ai/domain/glossary.md`](../../projects/alistigo-ai/domain/glossary.md)
- Research & decisions log: [`projects/alistigo-ai/notes.md`](../../projects/alistigo-ai/notes.md)
- Implementation tasks: [`ai/epics/alistigo-ai-m1/`](../epics/alistigo-ai-m1/)
