---
name: alistigo-artifact-plugins
description: Composable artifact plugin system — extract Sentry error monitoring and PostHog analytics into dynamically-loaded, npm-distributed plugins
status: backlog
created: 2026-07-09T09:56:43Z
---

# PRD: Composable Artifact Plugin System (Sentry + PostHog)

**Status:** Backlog
**Type:** Standalone (not part of the numbered M1–M6 milestone sequence)
**Depends on:** None blocking — can start immediately

## Executive Summary

`@alistigo/artifact-list` currently hardcodes Sentry error monitoring and PostHog analytics directly inside its `mount()` lifecycle. This PRD extracts that wiring into a composable plugin system: a typed `AlistigoPlugin` interface + event bus that any artifact can host, with Sentry and PostHog becoming the first two plugins, each distributed as its own npm package and loaded dynamically at runtime via `await import()` against a jsDelivr CDN URL — never bundled into the artifact build.

## Problem Statement

`packages/alistigo-artifact-list/src/monitoring.ts` (Sentry) and `packages/alistigo-artifact-list/src/analytics.ts` (PostHog) are inlined directly into `mount.ts`. This isn't duplicated *yet* only because `@alistigo/artifact-list` is the only artifact package that exists — but `docs/milestones.md` plans additional artifacts, and every one of them would otherwise have to re-copy this exact wiring (same DSN/key env-var reads, same idempotency guards, same React `ErrorBoundary` pattern). Extracting this now, while there is only one consumer, avoids a duplication problem before it exists and establishes the pattern any future artifact plugs into.

Two existing ADRs already chose the underlying tools and are **not** being revisited here: `docs/adrs/0008-error-monitoring.md` (Sentry) and `docs/adrs/0010-product-analytics.md` (PostHog, EU host, memory persistence). This PRD only changes *how* they're wired in.

### Pre-existing naming conflict (resolved)

`.agents/prds/alistigo-ai-m3.md` already reserves a *different* "Plugin Architecture" concept for domain/element-type plugins (e.g. a future `checkbox-element` plugin adding checkbox behavior to list items), with reserved package names `alistigo-plugin-api`/`alistigo-plugin-checkbox`. Decision made with the repo owner: **one unified `AlistigoPlugin` interface** covers both this round's infra/lifecycle plugins (Sentry, PostHog) and the future domain-contribution plugins from M3. It is built now as `@alistigo/artifact-plugin-api`. A follow-up task (F10 below) updates M3's PRD to point its F1 at this package instead of reserving a second, competing one.

## User Stories

- As a **developer adding a new `@alistigo` artifact**, I can enable error monitoring and analytics by listing plugin package names in the artifact's config, without writing any Sentry/PostHog integration code myself — so cross-cutting concerns aren't re-implemented per artifact.
  - Acceptance: given `config.plugins = { "@alistigo/artifact-sentry-plugin": {}, "@alistigo/artifact-posthog-plugin": {} }`, both plugins load and initialize with no additional code in the artifact package.
- As a **developer building a new plugin**, I implement `AlistigoPlugin` (lifecycle hooks + event subscriptions) and publish it to npm — the host artifact loads it dynamically without a build-time dependency — so plugin authors can ship and version independently of the artifact's own release cadence.
  - Acceptance: a plugin published as an npm package with a self-contained ESM build is `await import()`-able from a jsDelivr URL with zero import map and zero coupling to the artifact's own bundle.
  - Acceptance: a plugin whose `setup()`/`mounted()`/etc. throws does not crash the host mount or any other plugin.
- As the **repo owner**, I can see a documented architectural decision (ADR) explaining why artifacts are structured with a composable, npm-distributed, dynamically-loaded plugin system — so future contributors understand the rationale instead of re-litigating it.
- As a **developer using the artifact playground**, I can check which plugins to enable for the currently selected artifact type, and my selection persists across reloads — so I can develop/test plugin behavior without hand-editing config JSON.

## Functional Requirements

| Req | Description |
|-----|-------------|
| F1 | `@alistigo/artifact-plugin-api` package: `AlistigoPlugin` interface (lifecycle hooks `setup`/`beforeMount`/`mounted`/`destroy`, reserved `wrapRoot`, forward-compat domain-contribution stubs `dataShape`/`render`/`commands`/`events`), a typed `PluginEventBus` (`on`/`emit`), `PluginContext` (per-plugin config slice, host identity, logger, bus), `createPluginRuntime()` runtime helper, and `resolvePluginUrl()`/`loadPlugin()` CDN dynamic-import helpers |
| F2 | `@alistigo/artifact-config-format`: add `plugins?: Record<string, Record<string, unknown>>` to `ArtifactConfig` types, a shallow `assertPluginsField` validator (validates object-of-objects shape only, does not import or validate against any individual plugin's own schema), and matching JSON Schema changes in `schemas/artifact-config.json` — added to **both** the top-level `properties` and the `then.properties` block for `@alistigo/artifact-list` (whose `then` branch has `additionalProperties: false`) |
| F3 | `@alistigo/artifact-sentry-plugin` package: implements `AlistigoPlugin`, replaces `monitoring.ts`. `setup()` calls `Sentry.init(...)` once; subscribes to an `error:uncaught` event and calls `Sentry.captureException`. No `@sentry/react`/React dependency. |
| F4 | `@alistigo/artifact-posthog-plugin` package: implements `AlistigoPlugin`, replaces `analytics.ts`. `setup()` calls `posthog.init(...)` once; subscribes to a `widget:displayed` event and calls `posthog.capture("widget_displayed", ...)`. |
| F5 | Refactor `@alistigo/artifact-list`: delete `monitoring.ts`/`analytics.ts`; add `plugins.ts` (`loadPlugins(spec)` — `Promise.allSettled` over dynamic imports, logs and drops failures, never throws); `mount()` becomes `async` and invokes plugin lifecycle hooks at the equivalent points in the existing bootstrap sequence; replace the `@sentry/react`-provided `ErrorBoundary` with a small, permanent, host-owned generic `ErrorBoundary` (plain `componentDidCatch`, zero Sentry dependency) that emits `error:uncaught` on the plugin event bus; remove `@sentry/browser`, `@sentry/react`, `posthog-js` dependencies (moved to the plugin packages) |
| F6 | `debug.ts`'s `about()` genericized to report the set of loaded plugins and their reported status, instead of hardcoded monitoring/analytics-shaped fields |
| F7 | `apps/alistigo-artifact-playground`: a plugin-availability-per-artifact-type map (e.g. extending `ARTIFACT_REGISTRY` entries or a sibling map), a checkbox-list multi-select control in `HostForm.tsx` whose available options depend on the currently selected artifact type, and a JSON-encoded `plugins` query param that round-trips through `main.tsx`'s `#alistigo-config` tag construction |
| F8 | New ADR `docs/adrs/0016-artifact-plugin-system.md` documenting: the decision to structure artifacts with a composable plugin system (interface + event combination), the choice to expose plugins as independently-versioned npm packages, and the choice to dynamically load them via `await import()` against a CDN-resolved URL rather than bundling at build time. Update `docs/adrs/README.md`'s index table. |
| F9 | Two new Gherkin `.feature` files in `packages/alistigo-features/features/artifact-plugins/` (new group tag `@artifact-plugins`, reusing the existing `@capability:plugins` capability tag, new milestone tag `@platform` since this work is orthogonal to the numbered `@m1`–`@m4` sequence): `sentry-error-capture.feature` and `posthog-analytics-tracking.feature`, covering plugin initialization with resolved config, event-subscriber reactions to `error:uncaught`/`widget:displayed`, and silent no-op behavior when credentials are absent. Scenarios are app-level/deterministic — no real network calls, consistent with the rest of the suite. |
| F10 | Follow-up edit to `.agents/prds/alistigo-ai-m3.md`: update its F1 ("Plugin interface: data shape + render + commands + events") to reference `@alistigo/artifact-plugin-api` instead of reserving a second, competing `alistigo-plugin-api` package name |

## Non-Functional Requirements

| Req | Description |
|-----|-------------|
| NF1 | Plugin isolation — a failing plugin (throwing in any lifecycle hook or event handler) must never break the host artifact's mount or any other plugin; every hook invocation is individually try/caught and logged |
| NF2 | Plugin bundles must be self-contained ESM — loadable via a bare `await import(url)` in a browser with zero import map, meaning each plugin package's build externalizes nothing (bundles its own runtime dependencies like `@sentry/browser`/`posthog-js`) |
| NF3 | Config-format validation of `config.plugins` must not require importing any individual plugin package — validation stays shallow (object-of-objects), full per-plugin config validation is each plugin's own responsibility |
| NF4 | `mount()` becoming `async` is an accepted, intentional breaking change to the documented "explicit mount (advanced)" API in `index.tsx`; the primary auto-mount path is unaffected in practice since nothing awaits it today |
| NF5 | Plugin execution order follows `config.plugins` key insertion order — this is a documented contract, not an implementation detail, since `setup()` sequencing (and any future `wrapRoot` composition) depends on it |

## Success Criteria

- `pnpm build && pnpm build:typecheck` clean across `artifact-plugin-api`, `artifact-sentry-plugin`, `artifact-posthog-plugin`, `artifact-config-format`, and `artifact-list`
- `pnpm nx qa:lint` clean across all changed/new packages
- New `@artifact-plugins` Gherkin scenarios pass via the repo's existing runner
- All pre-existing `@m1`/`@core` Gherkin scenarios remain green (no regression from the `mount()` async change)
- In the playground: selecting the list artifact and checking both plugin checkboxes results in both plugins loading via dynamic `import()` from a jsDelivr `@0`-pinned URL (visible in the network tab)
- A forced render error still shows the existing fallback UI and is reported through the Sentry plugin's `error:uncaught` subscriber
- `docs/adrs/README.md` index and the `.agents/prds/alistigo-ai-m3.md` follow-up note (F10) are updated

## Constraints & Assumptions

- Reuses ADR 0011's existing jsDelivr major-version-pin convention (`@0`) for plugin URLs — no per-plugin version override in this round
- Reuses the existing `ARTIFACT_REGISTRY`-style CDN-URL-construction pattern from `packages/alistigo-artifact-manager/src/registry.ts` as precedent, generalized to plugin package names
- Plugin packages require a new build pattern in the repo: bundled, dependency-free ESM (`vite.config.ts` with `formats: ["es"]`, nothing externalized) — distinct from both existing precedents (`artifact-list`'s bundled UMD, `artifact-manager`'s unbundled `tsc` ESM)
- DSN/API-key secrets remain build-time secrets baked into each plugin's own bundle at that plugin's own publish time (own CI, own env vars) — `config.plugins["<pkg>"]` is for optional runtime overrides only, never secrets
- The pre-existing gap where `artifact-list` does not import `@alistigo/artifact-config-format` for schema validation is not closed by this PRD — `config.plugins` validation coverage remains partial exactly as today (only the `artifact-manager` `<script>`-injection path is schema-checked)

## Out of Scope

- A second artifact type consuming this plugin system (no second artifact exists yet)
- Actual implementation of M3's `checkbox-element` domain-contribution plugin — only the interface's forward-compat stubs (`dataShape`/`render`/`commands`/`events`) are reserved and typed, not built or consumed
- Per-plugin jsDelivr version-pin override (always `@0` this round)
- Full host ↔ iframe `postMessage` protocol (M5)
- Closing the pre-existing gap where `artifact-list` doesn't import `artifact-config-format` for schema validation

## Dependencies

- None blocking — can start immediately
- Informs, but does not block on, `.agents/prds/alistigo-ai-m3.md` (the follow-up note in F10 is one-directional: this PRD updates that one, not the reverse)

## References

- Architecture: `docs/architecture.md`, `docs/milestones.md`
- ADRs: `docs/adrs/0008-error-monitoring.md`, `docs/adrs/0010-product-analytics.md`, `docs/adrs/0011-jsdelivr-versioning-strategy.md`
- Related PRD (naming conflict, see above): `.agents/prds/alistigo-ai-m3.md`
- Config-format precedent: `.agents/prds/alistigo-ai-m2.md`
