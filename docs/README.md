---
status: in-progress
version: 0.1.0
createdAt: 2026-04-28
updatedAt: 2026-05-28
---

# Alistigo AI

An AI-native, embeddable list widget. Lists of any kind — todo, wishlist, shopping, grocery, comparison — rendered from a portable `ListDocument` (JSON-LD) inside an iframe, ready to be embedded in any AI chat or LLM artifact surface.

## Vision

LLMs constantly produce structured lists, but render them as flat markdown. Alistigo gives those lists a richer, interactive representation that:

- lives as a portable, semantically-rich `ListDocument` (schema.org `ItemList` + Alistigo extensions)
- renders inside an iframe as a `ListWidget` — so any chat UI, artifact runner, or canvas can embed it
- runs **100% in the browser** — no API, no backend, no cloud dependency
- composes from a base List + plugin system (checkbox, priority, due date, image, …)

## First Milestone

Working prototype: **the base List as artifact**. A standalone iframe-embeddable `ListWidget` that holds a List of text `ListElement`s, with add / delete / persist — and *no plugin behavior yet*. Specialised list types (todo, checklist, grocery, …) come from plugins composed on top of this base in later milestones.

See [milestones.md](milestones.md) for the full breakdown.

## Core Principles

| Principle | What it means |
|-----------|----------------|
| **Event-sourced + CQRS** | All mutations are appended `ListEvent`s; the `ListProjection` is derived from `reduce(ListEventLog)`. Source of truth = `ListEventLog`, not the `ListDocument`. Commands write, queries read. |
| **ListDocument = ListProjection** | A `ListDocument` is a JSON-LD snapshot of current state. The `ListWidget` is a viewer/editor on top of the `ListEventLog`; the `ListDocument` is what gets exported, embedded, and shown to LLMs. |
| **Client-first** | All state lives in the browser. APIs are an opt-in evolution, not a starting point. |
| **TDD via Gherkin** | Behavior is specified in `.feature` files **before** code. A runner validates the app against them. |
| **DDD separation** | Domain (`List`, `ListElement`, plugin, `ListEvent`, `ActorCommand`) is independent of rendering. The `ListWidget` is one projection consumer; sync, undo, audit are others. |
| **Semantic interop** | The `ListDocument` uses schema.org so other tools (search engines, agents, importers) understand it. |

## Documents in this Project

| File | Purpose |
|------|---------|
| [milestones.md](milestones.md) | Roadmap overview — links to PRDs for each milestone |
| [architecture.md](architecture.md) | Technical architecture: 8 load-bearing constraints, layering (DDD), iframe model, runner, evolution path |
| [domain/](domain/index.md) | DDD domain model — bounded context map, glossary, aggregate specs, `ListEvent`s, `ActorCommand`s |
| [`packages/alistigo-document-format/`](../../packages/alistigo-document-format/) | The `ListDocument` format (separate package) — JSON-LD with three sections (`meta`, `eventLog`, `projection`), JSON Schema, TypeScript types, and validation guidance |
| [`packages/alistigo-features/`](../../packages/alistigo-features/) | Gherkin `.feature` files (separate package) — behavior specs, tooling (Prettier + Gherklin + custom validator), tag taxonomy, style guide |
| [adrs/](adrs/) | Architecture Decision Records — one file per significant decision |
