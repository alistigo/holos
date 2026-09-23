# What is Alistigo?

Alistigo is a framework and collection of embeddable AI artifacts — a shared set of libraries and
conventions that let developers build any artifact (list, kanban, table, form, timeline…)
with a consistent quality floor, running 100% in the browser without a backend.
The **list artifact** (`@alistigo/artifact-list`) is the reference implementation.

## The Problem

When an AI is asked to create a shareable list artifact today, it writes a full app from
scratch — picking a UI library, wiring state management, handling persistence. Three
problems follow:

1. **Token cost.** Writing an entire app takes a lot of tokens for something as common as
   a list.
2. **Non-determinism.** Because AI is non-deterministic, every generated app looks and
   behaves differently. There is no consistent user experience.
3. **Limited features.** A generated app only has what the AI happened to include — no
   shared feature baseline, no way to extend it.

Alistigo solves this: the AI describes a *document*, not an app. Alistigo handles
rendering, interaction, and persistence. The AI stays in its lane (data and intent).

## The Framework

Alistigo started as a single-purpose list app. The scope expanded: Alistigo is now a **framework
for AI artifacts** — a shared set of libraries (`artifact-core`, `artifact-plugin-api`,
`artifact-manager`, …) that any artifact type plugs into. The list artifact became the
reference implementation, not the product.

A second artifact type (kanban, table, form…) requires only depending on
`@alistigo/artifact-core` and `@alistigo/artifact-core-components-react` — zero
scaffolding copied from the list.

## How It Works

1. An AI or host page provides a **config document**
   (`{ "app": "@alistigo/artifact-list", "lang": "en" }`)
2. The **artifact manager** (`@alistigo/artifact-manager`) reads the config, resolves the
   artifact bundle URL from jsDelivr, and boots it in an iframe
3. The **artifact** renders a rich interactive widget from a **state document** (JSON-LD,
   schema.org types)
4. All mutations are appended events; the document is a derived projection — deterministic
   and round-trippable

## Key Technical Characteristics

| Characteristic | Detail |
|----------------|--------|
| Browser-only | 100% in-browser; no backend required for core functionality |
| Event-sourced + CQRS | Mutations are appended events; documents are derived projections |
| Plugin system | Artifact capabilities are composed via plugins, not hardcoded |
| iframe isolation | Artifacts run in sandboxed iframes; no host-page DOM access |
| JSON-LD documents | Portable, machine-readable, schema.org-typed state |
| CDN delivery | Bundles served from jsDelivr; no npm install needed at runtime |
| Architecture as Code | CALM models define boundaries; dependency-cruiser validates in CI |

See [`architecture.md`](architecture.md) for the full set of load-bearing constraints and
the [`framework/`](framework/README.md) docs for the four-tier architecture diagram.

## Core Principles

| Principle | What it means |
|-----------|---------------|
| Event-sourced + CQRS | All mutations are appended events; projections are derived from `reduce(EventLog)`. Source of truth = event log, not the document. |
| Client-first | All state lives in the browser. APIs are an opt-in evolution, not a starting point. |
| TDD via Gherkin | Behavior is specified in `.feature` files before code. A runner validates the app against them. |
| DDD separation | Domain (entities, events, commands) is independent of rendering. The widget is one projection consumer; sync, undo, audit are others. |
| Semantic interop | Documents use schema.org so other tools (search engines, agents, importers) understand them. |
| Architecture as Code | CALM models define every system boundary; CI validates compliance. |
