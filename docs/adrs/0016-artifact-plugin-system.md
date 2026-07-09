---
status: accepted
date: 2026-07-09
deciders: Mikael Labrut
---

# ADR 0016 — Composable Artifact Plugin System

**Status:** Accepted
**Date:** 2026-07-09

## Context

`@alistigo/artifact-list` hardcoded Sentry error monitoring (`monitoring.ts`) and
PostHog analytics (`analytics.ts`) directly inside its `mount()` lifecycle. This was
not yet duplicated only because it is the only `@alistigo` artifact package that
exists — but `docs/milestones.md` plans additional artifacts, and every one of them
would otherwise have to re-implement this exact wiring (same DSN/key env-var reads,
same idempotency guards, same React `ErrorBoundary` pattern).

Separately, `.agents/prds/alistigo-ai-m3.md` already reserves a *different* "Plugin
Architecture" concept for domain/element-type plugins (e.g. a future `checkbox-element`
plugin adding checkbox behavior to list items), with package names
`alistigo-plugin-api`/`alistigo-plugin-checkbox`. Building a second, competing plugin
concept for this round's infra/lifecycle needs would fragment the platform into two
unrelated extension mechanisms. This ADR's decision is deliberately unified to serve
both.

Note: this ADR does **not** revisit the underlying tool choices — ADR 0008 (Sentry)
and ADR 0010 (PostHog, EU host, memory persistence) stand. It only changes *how* those
tools are wired into an artifact.

Requirements:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | A plugin can hook into an artifact's lifecycle (init, before/after mount, destroy) | P1 |
| R2 | A plugin can react to host-emitted events without the host knowing which plugins exist | P1 |
| R3 | A plugin failing (missing config, thrown error) never breaks the host mount or another plugin | P1 |
| R4 | Plugins ship as independently-versioned npm packages, not bundled into the artifact at build time | P1 |
| R5 | The same interface must be usable, later, by domain-contribution plugins (data shape, render, commands, events) — not just infra plugins | P2 |
| R6 | Config-format validation of `config.plugins` must not require importing any individual plugin package | P1 |

## Decision

Introduce `@alistigo/artifact-plugin-api` — a single, unified `AlistigoPlugin`
interface combining **lifecycle hooks** and an **event bus**:

```ts
export interface AlistigoPlugin {
  name: string; // must match the plugin's own npm package name
  setup?(ctx: PluginContext): void | Promise<void>;
  beforeMount?(ctx: PluginContext): void | Promise<void>;
  mounted?(ctx: PluginContext): void | Promise<void>;
  destroy?(ctx: PluginContext): void | Promise<void>;
  wrapRoot?(tree: ReactNode, ctx: PluginContext): ReactNode; // reserved, unused this round
  dataShape?: unknown;   // forward-compat stub for domain-contribution plugins (R5)
  render?: unknown;
  commands?: Record<string, (...args: unknown[]) => unknown>;
  events?: Record<string, unknown>;
}
```

`PluginContext` gives each hook invocation a typed event bus (`on`/`emit`), the
plugin's own config slice (`config.plugins["<pkg-name>"]`), and host identity
(package name, version, locale, environment). A `createPluginRuntime()` helper
sequences hook calls in `config.plugins` key-insertion order and individually
try/catches every invocation — satisfying R3 without any per-plugin special-casing
in the host.

**Config document**: `@alistigo/artifact-config-format` gains a `plugins` field —
`Record<string, Record<string, unknown>>` — validated only for shape (object of
objects). No individual plugin's config shape is validated at this layer (R6); that
is each plugin's own responsibility.

**Distribution & loading**: each plugin is its own versioned npm package
(`@alistigo/artifact-sentry-plugin`, `@alistigo/artifact-posthog-plugin`, …), built as
a self-contained ESM bundle (no externalized dependencies — a new build pattern:
`vite.config.ts` with `formats: ["es"]`, distinct from `artifact-list`'s bundled UMD
and `artifact-manager`'s unbundled `tsc` ESM). The host resolves a plugin's package
name to a jsDelivr URL — reusing ADR 0011's existing `@0` major-version-pin
convention, generalized from `artifact-manager`'s CDN-URL-construction precedent — and
loads it via `await import()`:

```ts
const url = `https://cdn.jsdelivr.net/npm/${packageName}@0/dist/index.js`;
const { default: plugin } = await import(/* @vite-ignore */ url);
```

This means plugins are never bundled into `@alistigo/artifact-list` at build time —
enabling/disabling a plugin is a config change, not a rebuild.

**ErrorBoundary redesign**: previously, `@sentry/react`'s `ErrorBoundary` wrapped the
rendered tree directly — meaning render-error resilience only existed when Sentry
happened to be present. Under the plugin model, `artifact-list` keeps a small,
permanent, host-owned `ErrorBoundary` (plain `componentDidCatch`, zero Sentry
dependency) that emits an `error:uncaught` event on the plugin bus. The Sentry plugin
becomes a pure `setup()` + event-subscriber (`ctx.on("error:uncaught", ...)`) with no
React dependency at all — the cleanest realization of the "interface + event"
combination this ADR is built on, and a strict improvement: render-error resilience no
longer depends on which plugins happen to be configured.

## Rationale

| Criterion | Middleware-array only | Hook-only (Tapable-style) | Bundle plugins at build time | **Interface + event bus (chosen)** |
|-----------|------------------------|---------------------------|-------------------------------|--------------------------------------|
| Supports both infra hooks and future domain contributions (R5) | 🟡 awkward | 🟡 awkward | N/A | ✅ |
| Plugin can react to events it doesn't control the timing of (R2) | ❌ | ✅ | N/A | ✅ |
| Enable/disable without rebuilding the artifact (R4) | N/A | N/A | ❌ | ✅ |
| One plugin's failure isolated (R3) | 🟡 manual per-call | ✅ | N/A | ✅ |
| Familiar mental model (Vite/Rollup plugin objects, Webpack Tapable, Obsidian/VS Code `onload`+events) | 🟡 partial | ✅ | N/A | ✅ |

A pure middleware array (functions called in sequence) doesn't naturally support
"react to an event whenever it happens" (R2) — that needs a subscribable bus, not just
ordered function calls. A pure hook-registration system (Tapable-style, no typed
interface) loses the clean `AlistigoPlugin` contract that domain-contribution plugins
(R5) will need to extend later. Bundling plugins at build time was rejected outright —
it fails R4 by definition; every new plugin or plugin toggle would require republishing
`@alistigo/artifact-list` itself, defeating the entire point of independent plugin
versioning.

The chosen design directly matches the repo owner's own framing: "a combination of
interface and event that a plugin can subscribe and react to."

## Consequences

**Positive:**
- `@alistigo/artifact-sentry-plugin` and `@alistigo/artifact-posthog-plugin` ship and
  version independently of `@alistigo/artifact-list` and of each other
- A future second artifact type reuses the exact same plugin-loading mechanism with
  zero copy-paste
- Render-error resilience (the `ErrorBoundary`) no longer depends on Sentry being
  configured — it's now a permanent host feature
- One plugin failing (missing DSN, thrown error in a hook) never breaks the host mount
  or any other plugin
- The same `AlistigoPlugin` interface is designed to serve M3's future domain-
  contribution plugins (checkbox etc.) without a second competing package

**Negative / tradeoffs accepted:**
- `mount()` is now `async` — a breaking change to the documented "explicit mount
  (advanced)" API in `artifact-list`'s `index.tsx`. Auto-mount, the primary path, is
  unaffected since nothing awaited it before either.
- Sentry's initialization moves from module-load time (before DOM ready) to inside
  `mount()` (after DOM ready, after plugin resolution) — a small, accepted narrowing of
  ADR 0008's R1 error-capture window.
- Plugin packages require a new build pattern (bundled, dependency-free ESM) not
  previously used anywhere in this repo.
- No per-plugin jsDelivr version-pin override yet — always `@0`, deferred until a
  concrete need arises.
- `config.plugins` validation stays shallow by design (R6); a malformed per-plugin
  config surfaces only when that plugin's own `setup()` runs, not at config-validation
  time.

## Alternatives considered

- **Two separate plugin systems** (one for infra/lifecycle, one for domain
  contributions per the original M3 PRD) — rejected: fragments the platform into two
  unrelated extension mechanisms for what is conceptually one idea ("a plugin extends
  an artifact"); explicitly ruled out in favor of one unified interface.
- **Middleware array** (`plugins: ((ctx) => void)[]` called in sequence) — rejected:
  doesn't naturally support event subscription (R2), and doesn't carry a named,
  typed contract a plugin author implements against.
- **Bundling plugins into the artifact build** — rejected: fails R4 outright; defeats
  independent plugin versioning, the entire reason for this system.
- **Keeping `@sentry/react`'s `ErrorBoundary`** — rejected: couples render-error
  resilience to whether Sentry happens to be configured; the host-owned generic
  boundary + event is strictly better and fits the interface-plus-event model.
