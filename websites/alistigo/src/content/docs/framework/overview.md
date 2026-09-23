---
title: Framework Overview
description: High-level overview of the Alistigo framework architecture and its four tiers.
---

Alistigo is a four-tier framework for building embeddable AI artifacts.

## Four Framework Tiers

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│  TIER 4 — DEV TOOLS                                             │
│  pnpm · Nx · Bun · Biome · Playwright · Fallow · CALM CLI      │
├─────────────────────────────────────────────────────────────────┤
│  TIER 3 — ARTIFACTS (reference implementation: List)            │
│  @alistigo/artifact-list  (UMD bundle served via jsDelivr)      │
│  ├── list-domain · list-document · list-document-editor         │
│  ├── list-components-react · list-features (Gherkin)            │
│  └── artifact-list-skill (agent skill definition)               │
├─────────────────────────────────────────────────────────────────┤
│  TIER 2 — ARTIFACT CORE (shared by all artifacts)               │
│  artifact-core · artifact-core-components-react                 │
│  artifact-plugin-api · ai-chat-async-api · logger               │
├─────────────────────────────────────────────────────────────────┤
│  TIER 1 — CORE INFRASTRUCTURE (CDN-loaded)                      │
│  artifact-manager · artifact-config-format                      │
│  artifact-sentry-plugin · artifact-posthog-plugin               │
│  claude-storage-plugin · local-storage-plugin                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

- **Event sourcing + CQRS** — mutations are appended events; projections are derived
- **Client-first** — 100% browser; no backend required for core functionality
- **Plugin system** — artifact capabilities are composed, not hardcoded
- **Architecture as Code** — CALM models define boundaries; CI validates compliance

## Packages

The framework is a pnpm + Nx monorepo. Published packages are scoped to `@alistigo/*`
and independently versioned. Architecture models live in `@alistigo/architecture` (private).

See the [Architecture Decisions](/adrs/) for the rationale behind each major choice.
