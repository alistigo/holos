---
title: Architecture
description: Eight load-bearing constraints that define the Alistigo platform architecture.
---

The Alistigo architecture is defined in two forms:

- **Prose** — human-readable constraints and rationale (this page)
- **CALM models** — machine-readable JSON in `@alistigo/architecture/systems/` (validated in CI)

## Eight Load-Bearing Constraints

These constraints are non-negotiable. Every package decision is evaluated against them.

| # | Constraint | Rationale |
|---|-----------|-----------|
| 1 | **Browser-only** — no backend required for core functionality | Artifacts must run inside AI chat iframes without server infrastructure |
| 2 | **Event sourcing + CQRS** — mutations are append-only events; views are derived projections | Enables undo, replay, sync, and AI-readable history |
| 3 | **Plugin system** — capabilities are composed via plugins, not hardcoded | Artifacts must be extensible without forking the core bundle |
| 4 | **iframe isolation** — artifacts run in sandboxed iframes; no host-page DOM access | Security boundary between the AI chat interface and the artifact |
| 5 | **JSON-LD document format** — canonical serialization uses JSON-LD with schema.org types | Portable, machine-readable, AI-injectable state |
| 6 | **CDN delivery** — artifact bundles are served from jsDelivr; no npm install in AI contexts | Claude artifacts cannot install packages at runtime |
| 7 | **Architecture as Code** — CALM models define boundaries; dependency-cruiser validates in CI | Prevents layer violations from accumulating silently |
| 8 | **TypeID entities** — all domain entities use TypeID for type-safe, sortable IDs | Avoids ID collisions and enables type inference from prefixes |

## DDD Layer Model

The platform follows a strict Domain-Driven Design layer model:

- **Domain** — pure business logic; no framework or infrastructure dependencies
- **Document** — serialization and projection; reads the event log, emits documents
- **Application** — artifact lifecycle, plugin wiring, React mounting
- **Infrastructure** — storage backends, analytics, CDN loaders

Cross-layer imports are forbidden and enforced by `dependency-cruiser` in CI.

## Architecture as Code

The `@alistigo/architecture` package contains CALM (Common Architecture Language Model) JSON models
that define every system, interface, and relationship in the platform. The `calm validate` CLI
runs in CI and blocks merge if models diverge from code.

See [ADR 0027](/adrs/) for the full rationale behind adopting CALM.
