---
status: accepted
date: 2026-07-27
deciders: Mikael Labrut
---

# ADR 0018 — Alistigo as a Platform for AI Artifacts

**Status:** Accepted  
**Date:** 2026-07-27

## Context

Milestones M1 and M2 shipped a single-purpose list app: `@alistigo/artifact-list`,
its config format, domain model, Gherkin specs, and an artifact playground. Every piece
of shared infrastructure (loading, error handling, CDN plugin loading) was wired
directly into the list artifact.

Three problems emerged when planning M3+:

1. **List-coupling in platform names.** Packages named `alistigo-domain`,
   `alistigo-document-format`, and `alistigo-document-editor` appear to be
   platform-level libraries, but they contain only list-specific domain logic.
   A developer building a second artifact (kanban, table, form) would need to
   copy the list artifact's loading sequence, error boundary, loading screen, and
   plugin plumbing with no shared foundation to stand on.

2. **No shared loading/error/badge UI.** The artifact's boot sequence (show a
   loading screen → load plugins → either show a ready screen or an error screen)
   is generic, but it lives inside `artifact-list`. Every new artifact would
   reimplement it.

3. **No defined AI→artifact communication mechanism.** AI chat cannot use
   `postMessage`, and having it rewrite the entire artifact HTML is wasteful and
   unpredictable. There is no standard, safe API surface for AI to call artifact
   actions.

Additionally, the `alistigo-` directory prefix on all `packages/` and `cli/` folders
is redundant — the whole repository is alistigo, and the prefix adds noise without
conveying information. npm package names (`@alistigo/*`) are already meaningful and
stay unchanged.

## Decision

**Alistigo is a platform for building AI artifacts**, not a list app. The list
artifact becomes the reference implementation, not the product.

### Platform Layer Model

```
┌──────────────────────────────────────────────────────────────┐
│  DEV TOOLS  (for artifact developers; published to npm +     │
│             deployed as demo apps)                           │
│  apps/alistigo-artifact-playground                           │
│  cli/agent-skill-tester                                      │
│  cli/list-features-runner-playwright                         │
│  packages/list-features                                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  ARTIFACTS  (one per use-case, shipped via npm + jsDelivr)   │
│  packages/artifact-list  ← reference implementation          │
│  (future: artifact-kanban, artifact-table, …)                │
│                                                              │
│  Each artifact has:                                          │
│  • own domain packages  (list-domain, list-document-format…) │
│  • own config-format leaf  (artifact-config-list-format)     │
│  • own skill package  (artifact-list-skill)                  │
│  • own Gherkin features + runner  (list-features)            │
└────────────────────────────┬─────────────────────────────────┘
                             │ uses
┌────────────────────────────▼─────────────────────────────────┐
│  ARTIFACT CORE  (shared by all artifacts)                    │
│  @alistigo/artifact-core               lifecycle & phases    │
│  @alistigo/artifact-core-components-react  shared UI         │
│  @alistigo/artifact-plugin-api         plugin interface+bus  │
│  @alistigo/ai-chat-async-api           AI async API executor │
│  @alistigo/logger                      structured logging    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  PLATFORM INFRA  (CDN-loaded, independently versioned)       │
│  @alistigo/artifact-manager            CDN resolver+injector │
│  @alistigo/artifact-config-format      discriminated union   │
│  @alistigo/artifact-sentry-plugin      error monitoring      │
│  @alistigo/artifact-posthog-plugin     analytics             │
│  (future: auth plugin, other infra plugins)                  │
└──────────────────────────────────────────────────────────────┘
```

### Artifact Contract

Every `@alistigo` artifact must implement:

| Contract item | Required | Provided by | Description |
|---|---|---|---|
| Lifecycle phases | **mandatory** | `@alistigo/artifact-core` | `loading → ready \| error`; startup runs `startArtifact()` |
| Loading screen | **mandatory** | `@alistigo/artifact-core-components-react` | Shown during `loading` phase; shows logo + spinner |
| Error screen | **mandatory** | `@alistigo/artifact-core-components-react` | Shown on uncaught error; shows message + optional reset |
| Alistigo badge | **mandatory** | `@alistigo/artifact-core-components-react` | Top-right corner; collapsed logo; click → info modal |
| Plugin hook | **mandatory** | `@alistigo/artifact-plugin-api` | Lifecycle + event bus for all CDN-loaded plugins |
| Config-doc + State-doc | **mandatory** | `@alistigo/artifact-config-format` | Two-document contract (see ADR 0012 §12) |
| Agent skill | **mandatory** | Per-artifact skill package | SKILL.md teaches AI when/how/config |
| AI async API | **optional** | `@alistigo/ai-chat-async-api` | `<api-calls>` tag executor; artifact publishes `api.json`; can be omitted or added as a plugin if the artifact does not expose an action API |

### Skill Pattern

Every artifact ships a skill package (`packages/artifact-<name>-skill/`) with a
`SKILL.md` file. The skill teaches the AI chat agent:

1. **What** the artifact is (1-paragraph description)
2. **When** to use it (trigger phrases, use-cases)
3. **Config** — how to write the config document (fields, defaults, example JSON)
4. **API** — how to call artifact actions (operations, params, example `<api-calls>` tag); only included if the artifact implements the AI async API

The skill follows the agentskills.io standard (ADR 0015). The list artifact's
`packages/artifact-list-skill/SKILL.md` is the canonical reference.

### Plugin Type Taxonomy

| Type | Purpose | Examples | Status |
|------|---------|---------|--------|
| infra | Lifecycle monitoring, analytics | `sentry-plugin`, `posthog-plugin` | Implemented (ADR 0016) |
| domain | Data-shape extensions, render contributions | `checkbox-element` (M3) | Planned |
| storage | Document persistence backends | `claude-storage-plugin`, `local-storage-plugin` | Implemented (ADR 0017) |
| auth | User identity + authentication | (no implementation yet) | Planned (`@experimental` stub in artifact-core) |

### Naming Convention

- **Platform packages** (shared by all artifacts): generic names — `artifact-core`,
  `artifact-plugin-api`, `ai-chat-async-api`, `logger`
- **Artifact-specific packages**: carry the artifact name — `artifact-list`,
  `list-domain`, `list-document-format`, `list-document-editor`, `list-features`,
  `artifact-list-skill`, `artifact-config-list-format`
- **Directory names**: drop the `alistigo-` prefix (e.g. `packages/alistigo-domain`
  → `packages/list-domain`). npm package names (`@alistigo/*`) are unchanged.

### AI Async API Mechanism (Optional)

The AI async API is **not required** of every artifact. An artifact that has no
meaningful action API (e.g. a pure display widget) does not need to implement it.
When implemented, it works as follows:

AI chat cannot `postMessage` into an iframe, but it can write HTML. We exploit this:

1. AI writes `<api-calls>[{ "action": "addElement", "params": { "text": "Buy milk" } }]</api-calls>` into the artifact's HTML
2. On boot, the artifact's `ApiCallsExecutor` detects the tag, parses the JSON array
3. Each action is dispatched to the artifact's registered handler in order
4. The tag is removed from the DOM after execution
5. `parent.postMessage({ type: "alistigo:api-calls-result", … })` emits per-call status
   (for playground display; AI never reads the result)

Each artifact that exposes an API publishes an `api.json` file describing its operations
in an AsyncAPI 3.0 subset. The playground reads this to show available actions in its
AI API Simulator tab.

The feature can also be wired in as a plugin rather than being hardcoded in the artifact.

### Milestone Reframing

- **P0 — Platform Foundation**: the current work (this epic). Prerequisite for all
  M3+ list milestones.
- **M1–M6**: renamed to "List Artifact Milestones" — they build on the P0 platform,
  using the list artifact as the reference implementation.

## Rationale

| Option | Considered | Rejected because |
|--------|-----------|-----------------|
| Keep list-specific names for everything | Yes | Blocks new artifact development; forces copy-paste |
| Build a second artifact framework from scratch | Yes | Redundant with existing plugin system |
| Rename + shared platform libs (chosen) | — | Minimal change; preserves all existing work |

The chosen approach is the minimal structural change that unlocks multi-artifact
development without discarding the existing codebase. Every existing package is
preserved — only directory names and 4 npm names change.

## Consequences

**Positive:**
- A second artifact can be built by depending on `artifact-core` + `artifact-core-components-react` — no copy-paste from the list artifact
- AI chat has a stable, safe API surface for calling artifact actions
- The Alistigo badge + info modal gives all artifacts a consistent identity element
- List-specific packages are clearly labeled; platform packages are clearly generic
- Directory names are cleaner (no `alistigo-` noise)

**Negative / tradeoffs accepted:**
- Package renames require updating all import paths across the monorepo (tracked in Issue #46)
- Three new packages must be created and stabilized before M3 starts
- The `artifact-core` startup sequence abstracts away some of `artifact-list`'s explicitness

## References

- [ADR 0016](./0016-artifact-plugin-system.md) — Composable Artifact Plugin System (the plugin interface and event bus that `artifact-core` delegates to)
- [ADR 0017](./0017-storage-plugin-system.md) — Storage Plugin System
- [ADR 0015](./0015-agent-skills-standard.md) — Agent Skills Standard (agentskills.io)
- [ADR 0012](./0012-component-documentation.md) — Component Documentation Standard (Storybook)
- [docs/platform/](../platform/) — Platform documentation (created in Issue #53)
- [Epic #44](https://github.com/alistigo/holos/issues/44) — Implementation tracking
