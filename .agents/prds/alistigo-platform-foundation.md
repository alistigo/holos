---
name: alistigo-platform-foundation
description: Reframe Alistigo from a list app into a platform for AI artifacts — core libs, renames, API layer, and docs
status: active
created: 2026-07-27T09:07:11Z
---

# PRD: Alistigo Platform Foundation (P0)

## Executive Summary

Alistigo started as a single-purpose list app. After shipping M1 (base list) and M2
(artifact playground + config system), the scope expands: Alistigo is now a **platform
for AI artifacts** — a shared set of libraries and conventions that let any developer
build any artifact (list, kanban, table, form, timeline…) with a consistent quality floor
and minimal boilerplate. The list artifact becomes the reference implementation, not the
product.

This milestone (P0) lays the platform foundation before M3 work resumes:
- An ADR capturing the scope change
- Package renames removing list-coupling from platform code
- Three new shared libraries (artifact-core, artifact-core-components-react, ai-chat-async-api)
- Updated playground with an AI API simulator tab
- Documentation and milestone alignment

## Problem Statement

Every library in the monorepo grew from the list artifact. Today, `alistigo-domain`,
`alistigo-document-format`, `alistigo-document-editor`, and `alistigo-features` are named
as if they're platform-level libraries — but they're entirely list-specific. If a second
artifact type (say, a kanban board) were started today, the developer would have no shared
loading system, no shared error handling, no shared badge, no shared AI API mechanism, and
no shared loading UI. They'd copy-paste from the list artifact and diverge immediately.

Additionally, the `alistigo-` directory prefix on all packages adds noise without benefit
since the entire repo is alistigo.

## User Stories

| Role | Story | Acceptance |
|------|-------|------------|
| Platform developer | I can build a new artifact by depending on `artifact-core` and `artifact-core-components-react`, without copying from the list artifact | New artifact shows loading screen, error screen, and badge out of the box |
| Platform developer | I can register actions on my artifact so AI chat can call them via the `<api-calls>` tag | Artifact reads and executes the tag; playground simulator confirms |
| Playground user | I can see and send API calls to the running artifact from the playground's AI API tab | Call appears in log with status |
| List artifact developer | The list artifact continues to work exactly as before after the renames and refactor | All Gherkin scenarios pass; playground loads normally |
| Future artifact developer | Package names clearly signal what's platform-level vs list-specific | Packages with "list" in their name are list-only; others are shared |

## Functional Requirements

| ID | Requirement |
|----|-------------|
| F1 | ADR 0018 written: Alistigo as a Platform for AI Artifacts |
| F2 | All `alistigo-` dir prefixes removed from `packages/` and `cli/` directories |
| F3 | List-specific packages renamed to include "list" in their npm name |
| F4 | `document-validator` CLI accepts `--schema` arg to validate any artifact's document |
| F5 | `@alistigo/artifact-core` package: lifecycle phases, startup sequence, error boundary |
| F6 | `@alistigo/artifact-core-components-react` package: LoadingScreen, ErrorScreen, AlistigoBadge, ArtifactInfoModal + Storybook |
| F7 | List artifact integrated with artifact-core: shows LoadingScreen/ErrorScreen/badge |
| F8 | `@alistigo/ai-chat-async-api` package: `<api-calls>` tag parser + executor + AsyncAPI-subset definition |
| F9 | List artifact publishes its API definition (`api.json`) |
| F10 | Playground "AI API" tab: load artifact API definition, send actions, show call log |
| F11 | `docs/architecture.md` rewritten for platform scope |
| F12 | `docs/milestones.md` gains P0 milestone; M1-M6 become "List Artifact Milestones" |
| F13 | `docs/platform/` created with artifact-contract, skill-pattern, plugin-types, layer-diagram |
| F14 | `docs/domain/` subdocs gain "List Artifact domain only" scope banners |
| F15 | All existing Gherkin scenarios pass after the refactor |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | No regressions: `pnpm build:typecheck` and `pnpm qa:lint` pass after every task |
| NF2 | All existing Gherkin scenarios stay green throughout |
| NF3 | artifact-core has zero list-specific code |
| NF4 | New packages follow existing repo conventions (project.json, tsconfig.json, Biome) |
| NF5 | Storybook stories cover all new components in artifact-core-components-react |
| NF6 | AsyncAPI-subset format in ai-chat-async-api is documented in a spec file |

## Success Criteria

1. `pnpm build:typecheck && pnpm qa:lint && pnpm test` are all green after all tasks
2. Starting a second artifact requires only depending on `artifact-core` + `artifact-core-components-react`; zero code copied from the list artifact
3. The playground AI API tab successfully sends an `addElement` action to the list artifact
4. Alistigo badge visible in top-right of list artifact; modal shows name, version, plugin list
5. ADR 0018 is accepted and referenced from the ADR index
6. `docs/platform/` exists with all four documents

## Constraints & Assumptions

- All npm package names stay at `@alistigo/*` scope — only directory names and list-specific package names change
- artifact-core is framework-agnostic at its core; React-specific code lives in artifact-core-components-react
- ai-chat-async-api adopts a subset of AsyncAPI 3.0 (not the full spec)
- Auth plugin is out of scope for P0, but artifact-core includes an `AuthPlugin` type stub marked `@experimental`
- The `alistigo-logger` package is NOT absorbed into artifact-core; it remains a separate dep

## Out of Scope

- Any new artifact type beyond the list (no kanban, no table — list is the reference implementation)
- Auth plugin implementation (type stub only)
- Full AsyncAPI 3.0 compliance (subset sufficient for P0)
- Storybook for any package other than artifact-core-components-react
- Drag-and-drop, undo, or any new list feature
- Backend, sync, or multi-user support
- CI/CD changes

## Dependencies

- M1 and M2 must be complete (they are as of July 2026)
- The `alistigo-artifact-plugin-api` package (ADR 0016, delivered) is the plugin foundation
- AsyncAPI 3.0 spec review needed before implementing ai-chat-async-api format
