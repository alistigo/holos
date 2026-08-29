---
name: alistigo-platform-foundation
status: in-progress
created: 2026-07-27T09:07:11Z
updated: 2026-07-27T09:16:34Z
progress: 0%
prd: .claude/prds/alistigo-platform-foundation.md
github: https://github.com/alistigo/holos/issues/44
---

# Epic: Alistigo Platform Foundation (P0)

## Overview

Reframe Alistigo from a list app into a platform for AI artifacts. This epic covers:
the ADR formalizing the scope shift, package renames stripping list-coupling from
platform code, three new shared libraries, playground AI API simulator, and doc/milestone
alignment.

## Architecture Decisions

- **ADR 0018** (new): Alistigo as Platform for AI Artifacts
- **ADR 0016** (existing): Composable Plugin System — artifact-core delegates to it
- **ADR 0012** (existing): Storybook for component packages — artifact-core-components-react must follow
- `artifact-core` is React peer-dep aware (not bundled); `artifact-core-components-react` carries the UI
- `ai-chat-async-api` uses AsyncAPI 3.0 subset; full spec deferred
- Auth plugin: type stub only in artifact-core (`@experimental`), no implementation

## Platform Layer Model

```
DEV TOOLS      playground, agent-skill-tester, list-features-runner-playwright
     │
ARTIFACTS      artifact-list (reference), future artifacts
     │ uses
ARTIFACT CORE  artifact-core, artifact-core-components-react, artifact-plugin-api,
               ai-chat-async-api, logger
     │
PLATFORM INFRA artifact-manager, artifact-config-format, sentry-plugin, posthog-plugin
```

## Package Rename Map (directory → directory, npm name if changed)

| Old dir (packages/) | New dir | npm name change |
|---------------------|---------|-----------------|
| alistigo-logger | logger | — |
| alistigo-artifact-plugin-api | artifact-plugin-api | — |
| alistigo-artifact-manager | artifact-manager | — |
| alistigo-artifact-config-format | artifact-config-format | — |
| alistigo-artifact-config-list-format | artifact-config-list-format | — |
| alistigo-artifact-sentry-plugin | artifact-sentry-plugin | — |
| alistigo-artifact-posthog-plugin | artifact-posthog-plugin | — |
| alistigo-artifact-list | artifact-list | — |
| alistigo-artifact-list-skill | artifact-list-skill | — |
| alistigo-artifact-manager-skill | artifact-manager-skill | — |
| alistigo-list-components-react | list-components-react | — |
| alistigo-claude-storage-plugin | claude-storage-plugin | — |
| alistigo-local-storage-plugin | local-storage-plugin | — |
| alistigo-claude-artifact-list-storage | claude-artifact-list-storage | — |
| alistigo-local-storage-repository | local-storage-repository | — |
| alistigo-domain | list-domain | @alistigo/domain → @alistigo/list-domain |
| alistigo-document-format | list-document-format | @alistigo/core-document-format → @alistigo/list-document-format |
| alistigo-document-editor | list-document-editor | @alistigo/core-document-editor → @alistigo/list-document-editor |
| alistigo-features | list-features | @alistigo/features → @alistigo/list-features |
| cli: alistigo-document-validator | document-validator | — |
| cli: alistigo-features-runner-playwright | list-features-runner-playwright | @alistigo/features-runner-playwright → @alistigo/list-features-runner-playwright |

## New Packages

| Package | Directory | Purpose |
|---------|-----------|---------|
| @alistigo/artifact-core | packages/artifact-core | Lifecycle phases, startup, error boundary |
| @alistigo/artifact-core-components-react | packages/artifact-core-components-react | LoadingScreen, ErrorScreen, AlistigoBadge, ArtifactInfoModal |
| @alistigo/ai-chat-async-api | packages/ai-chat-async-api | `<api-calls>` tag executor + AsyncAPI-subset definition type |

## Task Breakdown

| # | Task | Depends on | Parallel |
|---|------|-----------|---------|
| 45 | ADR 0018 — Alistigo as a Platform for AI Artifacts | — | yes |
| 46 | Rename all package directories + list-specific npm names | — | yes |
| 47 | Make document-validator CLI generic (--schema arg) | 46 | yes |
| 48 | Scaffold @alistigo/artifact-core | 45 | no |
| 49 | Scaffold @alistigo/artifact-core-components-react + Storybook | 48 | no |
| 50 | Integrate artifact-core into list artifact | 48, 49 | no |
| 51 | Scaffold @alistigo/ai-chat-async-api | 48 | yes |
| 52 | Add AI API Simulator tab to playground | 50, 51 | no |
| 53 | Update platform-level documentation | 45, 46 | yes |
| 54 | Write Platform Foundation PRD, update milestone docs | 45 | yes |

## Parallel Streams

- **Stream A** (sequential): 45 → 48 → 49 → 50
- **Stream B** (parallel with A after 45+46): 46 → 47
- **Stream C** (after A completes): 51 → 52
- **Stream D** (after 45+46): 53, 54 in parallel

## Success Criteria (Technical)

1. `pnpm build:typecheck && pnpm qa:lint && pnpm test` green after all tasks
2. New `artifact-core` has zero list-domain imports
3. All 4 component stories visible in Storybook for artifact-core-components-react
4. List artifact loads with LoadingScreen → badge visible top-right → modal works
5. Playground AI API tab sends `addElement`, call log shows result
6. ADR 0018 in `docs/adrs/` with entry in README.md index
7. `docs/platform/` contains 4 documents

## Estimated Effort

Large — 10 tasks spanning docs, refactoring, 3 new packages, playground feature, and
integration. Estimated 3–5 days of focused development.
