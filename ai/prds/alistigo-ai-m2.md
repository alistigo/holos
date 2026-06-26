---
name: alistigo-ai-m2
description: Artifact Playground & Common Architecture — generic harness, config format packages, and artifact manager
status: backlog
created: 2026-06-11T14:20:20Z
---

# PRD: Alistigo AI — M2 Artifact Playground & Common Architecture (v0.3.0)

**Status:** Backlog
**Milestone:** M2
**Depends on:** M1 (v0.2.0)

## Executive Summary

M1 ships a single hardwired list artifact in a single hardwired app. M2 extracts the
plumbing into a **reusable platform**: a generic Artifact Playground that can host *any*
`@alistigo` artifact, a config format system so artifacts are consistently configurable,
and an artifact manager that resolves artifact names to CDN URLs and boots them. This is
foundational infrastructure — every future artifact plugs into this system without
repeating the iframe/host wiring.

## Problem Statement

M1 couples the list UI, the embedding harness, and the app entrypoint together. Building
a second artifact would mean copying all of that scaffolding. M2 decouples them so the
platform is built once and artifacts are independently deliverable.

## User Stories

- As a **developer**, I can open the Artifact Playground, select an artifact type and
  language, and see it running inside a Claude-like iframe — so I can develop and test
  artifacts in a realistic embedding context.
- As a **developer**, I can click "Reload" to force-refresh the iframe, and "Clear Data"
  to wipe localStorage — so I can iterate quickly without manual browser steps.
- As a **developer**, I can toggle the list artifact's `readonly` mode — so I can verify
  the display-only rendering path without modifying code.
- As a **developer**, the playground iframe respects the same sandbox constraints as
  Claude's real artifact iframe — so behavior in the playground matches production.

## Functional Requirements

| Req | Description |
|-----|-------------|
| F1  | Rename `packages/alistigo-artifact` → `packages/alistigo-artifact-list` (npm: `@alistigo/artifact-list`); update all references |
| F2  | Rename `apps/alistigo-list-embedded-app` → `apps/alistigo-artifact-playground` |
| F3  | `@alistigo/artifact-config-list-format`: JSON Schema + TS types for list-specific config; includes `readonly` (boolean, default false) |
| F4  | `@alistigo/artifact-config-format`: base config schema (`{ "app": "<name>", ... }`) + discriminated union combining all known per-artifact schemas; validates a config document against the full schema; depends on `@alistigo/artifact-config-list-format` |
| F5  | `@alistigo/artifact-manager`: reads config JSON from host page, validates via `@alistigo/artifact-config-format`, resolves `config.app` to CDN UMD URL, injects `<script>` tag; exported as UMD + ESM |
| F6  | Playground host page: split vertically — left Dev Config Form (React), right `<iframe>` |
| F7  | Dev Config Form — generic controls: artifact type selector (from manager artifact map), language selector, AI chat context selector (fixed: "claude"), reload button, clear-data button |
| F8  | Dev Config Form — dynamic section below generic controls for per-artifact config (for M2: list `readonly` toggle) |
| F9  | Playground iframe page: runs `@alistigo/artifact-manager` and boots the selected artifact |
| F10 | Claude iframe simulation: `sandbox="allow-scripts allow-same-origin"`, `referrerpolicy="no-referrer"`, `data-no-service-worker="true"`, `allow="fullscreen; clipboard-write"`, `style` only (no class attribute for sizing) |
| F11 | CSP headers on iframe page: match Claude's CSP with `localhost` / `127.0.0.1` added to the allowed-host list; implemented via Vite dev server middleware |
| F12 | All `@m1` Gherkin scenarios continue to pass against the refactored app |

## Non-Functional Requirements

| Req | Description |
|-----|-------------|
| NF1 | `@alistigo/artifact-manager` UMD bundle is self-contained (no external runtime deps) |
| NF2 | Config validation produces a clear, actionable error when `app` value is unknown |
| NF3 | Playground loads and renders the list artifact within 2 s on localhost |

## Success Criteria

- `pnpm build` clean across all renamed/new packages
- `pnpm test` green for all `@m1` scenarios in the refactored playground
- Playground correctly boots `@alistigo/artifact-list` from the manager's artifact map
- Toggling `readonly` in the Dev Config Form renders the list without add/delete controls
- Iframe attributes in the playground match the Claude spec exactly (F10)

## Constraints & Assumptions

- `@alistigo/artifact-config-list-format` is a leaf package (no `@alistigo` dependencies)
- `@alistigo/artifact-config-format` depends on `@alistigo/artifact-config-list-format` — not the reverse; future per-artifact format packages are added as additional dependencies of `artifact-config-format`
- CDN URL for `@alistigo/artifact-list` is the same URL established in M1 deployment; hardcoded in `artifact-manager` for M2, configurable post-M2
- The dynamic per-artifact section of the Dev Config Form is scaffolded in M2 (with the list's `readonly` toggle) but the extension mechanism for future artifact types is deferred

## Out of Scope

- Plugin system (M3)
- Second artifact type (M3+)
- postMessage host ↔ iframe protocol beyond what `@alistigo/artifact-manager` already does (M5)
- Production CDN hosting (M6)

## Dependencies

- M1 completed and merged
- `@alistigo/artifact-list` CDN URL known (from M1 deployment)

## Architecture Principle — Config-Doc / State-Doc Contract

Every `@alistigo` artifact follows a two-document contract:

**Config document** — JSON provided on the host page (via a DOM element or postMessage API)
that configures the artifact before it boots:
```json
{ "app": "@alistigo/artifact-list", "lang": "en" }
```

**State document** — JSON the artifact reads/writes; can be pre-loaded from the page or
injected via API. Represents the artifact's persisted domain state.

Both documents are self-contained, version-stamped, and round-trippable. This makes every
artifact embeddable in any host without bespoke integration code.

## Package Dependency Graph

```
@alistigo/artifact-config-list-format   (leaf)
          ↑ imported by
@alistigo/artifact-config-format
          ↑ used by
@alistigo/artifact-manager
          ↑ used by
apps/alistigo-artifact-playground
```

## References

- Architecture constraints: `projects/alistigo-ai/architecture.md`
- Milestones overview: `projects/alistigo-ai/milestones.md` §M2
- M1 PRD: `ai/prds/alistigo-ai-m1.md`
