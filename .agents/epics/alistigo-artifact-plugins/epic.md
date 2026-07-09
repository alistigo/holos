---
name: alistigo-artifact-plugins
status: backlog
created: 2026-07-09T09:57:47Z
updated: 2026-07-09T10:10:17Z
progress: 0%
prd: .claude/prds/alistigo-artifact-plugins.md
github: https://github.com/alistigo/holos/issues/12
---

# Epic: alistigo-artifact-plugins — Composable Artifact Plugin System (Sentry + PostHog)

## Overview

Extract the hardcoded Sentry (`monitoring.ts`) and PostHog (`analytics.ts`) wiring out of
`@alistigo/artifact-list` into a composable plugin system: a typed `AlistigoPlugin`
interface + event bus (new package `@alistigo/artifact-plugin-api`) that any artifact can
host, with Sentry and PostHog becoming the first two plugins — each its own npm package,
loaded dynamically at runtime via `await import()` against a jsDelivr CDN URL.

This is a standalone epic, independent of the numbered M1–M6 milestone sequence. It
resolves a naming conflict with `.agents/prds/alistigo-ai-m3.md` (which reserves a
different, domain/element-type "Plugin Architecture" concept) by building one unified
`AlistigoPlugin` interface that covers both this epic's infra/lifecycle plugins and M3's
future domain-contribution plugins (typed stubs only, not implemented here).

## Architecture Decisions

1. **One unified plugin interface, not two.** `@alistigo/artifact-plugin-api` is built to
   serve both this epic's lifecycle/infra plugins (Sentry, PostHog) and M3's future
   domain-contribution plugins (checkbox etc.) — via optional, currently-unconsumed
   `dataShape`/`render`/`commands`/`events` fields on the same `AlistigoPlugin` interface.
   M3's PRD gets a follow-up note pointing it at this package (task 010).

2. **Interface + event bus, not a middleware chain.** Lifecycle hooks
   (`setup`/`beforeMount`/`mounted`/`destroy`) are typed methods a plugin implements
   directly; cross-cutting reactions (a render error, a first-mount event) go through a
   typed `PluginEventBus` (`on`/`emit`) plugins subscribe to. This is the
   "interface + event" combination the repo owner specified, modeled on the
   Vite/Rollup plugin-object-with-lifecycle-hooks pattern.

3. **ErrorBoundary becomes host-owned and generic.** `artifact-list` keeps a small,
   permanent `ErrorBoundary` (plain `componentDidCatch`, zero Sentry dependency) that
   emits an `error:uncaught` event. The Sentry plugin is a pure `setup()` +
   event-subscriber — it never touches React. This drops `@sentry/react` entirely from
   the Sentry plugin package.

4. **Plugins load via `await import()` against a jsDelivr URL, never bundled.** Reuses
   ADR 0011's `@0` major-version-pin convention, generalized from artifact-manager's
   existing `<script>`-injection precedent (`registry.ts`) to a bare dynamic `import()`.
   This requires plugin packages to ship bundled, dependency-free ESM (`formats: ["es"]`,
   nothing externalized) — a new build pattern in this repo, distinct from both
   artifact-list's bundled UMD and artifact-manager's unbundled `tsc` ESM.

5. **Config-format validates shape only, never a specific plugin's schema.** `plugins` in
   `@alistigo/artifact-config-format` is validated as "object of objects" — deeper
   validation of `plugins["<pkg>"]`'s shape is each plugin's own responsibility, so
   config-format never imports a plugin package.

## Technical Approach

### New Packages

| Package | Role |
|---------|------|
| `@alistigo/artifact-plugin-api` | Plugin interface, event bus, runtime, CDN dynamic-import loader |
| `@alistigo/artifact-sentry-plugin` | Sentry error monitoring plugin (replaces `monitoring.ts`) |
| `@alistigo/artifact-posthog-plugin` | PostHog analytics plugin (replaces `analytics.ts`) |

### Changed Packages

| Package | Change |
|---------|--------|
| `@alistigo/artifact-config-format` | `plugins` field in types/schema/validate |
| `@alistigo/artifact-list` | Remove `monitoring.ts`/`analytics.ts`; add `plugins.ts`; async `mount()`; generic host `ErrorBoundary`; genericize `debug.ts` |
| `apps/alistigo-artifact-playground` | Plugin-availability map + checkbox multi-select in `HostForm.tsx` |

### Plugin Interface (settled design)

```ts
export interface AlistigoPluginEventMap {
  "widget:displayed": { locale: string; storageType: string; version: string };
  "error:uncaught": { error: unknown; componentStack?: string };
}
export interface PluginEventBus {
  on<E extends keyof AlistigoPluginEventMap>(event: E, handler: (payload: AlistigoPluginEventMap[E]) => void): () => void;
  emit<E extends keyof AlistigoPluginEventMap>(event: E, payload: AlistigoPluginEventMap[E]): void;
}
export interface PluginContext {
  config: Record<string, unknown>;
  host: { packageName: string; version: string; locale: string; environment: string };
  logger: { info: (o: unknown, msg?: string) => void; error: (o: unknown, msg?: string) => void };
  on: PluginEventBus["on"];
  emit: PluginEventBus["emit"];
}
export interface AlistigoPlugin {
  name: string;
  setup?(ctx: PluginContext): void | Promise<void>;
  beforeMount?(ctx: PluginContext): void | Promise<void>;
  mounted?(ctx: PluginContext): void | Promise<void>;
  destroy?(ctx: PluginContext): void | Promise<void>;
  wrapRoot?(tree: ReactNode, ctx: PluginContext): ReactNode; // reserved, unused this epic
  dataShape?: unknown; render?: unknown;                     // M3 forward-compat stubs
  commands?: Record<string, (...args: unknown[]) => unknown>;
  events?: Record<string, unknown>;
}
```

`resolvePluginUrl(pkg)` → `https://cdn.jsdelivr.net/npm/<pkg>@0/dist/index.js`;
`loadPlugin(pkg)` → `await import(resolvePluginUrl(pkg))`. `createPluginRuntime()`
sequences hooks in `config.plugins` key-insertion order, wrapping each call in
try/catch so one plugin's failure never breaks the host or another plugin.

## Implementation Strategy

Tasks 001 and 002 have no dependencies and can start in parallel. Tasks 003 and 004
both depend only on 001 and can run in parallel with each other. Task 005 (the
artifact-list refactor) depends on 001+002 for its types, but full integration
verification needs 003+004 to exist. Tasks 006, 007, 009 depend on 005. Task 008 (the
ADR) documents the settled design once 001–005 exist. Task 010 (M3 PRD follow-up) has
no dependencies and can happen anytime.

## Task Breakdown Preview

| Task | Title | Parallel | Depends On |
|------|-------|----------|-----------|
| 001 | Scaffold `@alistigo/artifact-plugin-api` | Yes | — |
| 002 | Add `plugins` field to `@alistigo/artifact-config-format` | Yes | — |
| 003 | Scaffold `@alistigo/artifact-sentry-plugin` | Yes | 001 |
| 004 | Scaffold `@alistigo/artifact-posthog-plugin` | Yes | 001 |
| 005 | Refactor `@alistigo/artifact-list` to load plugins | No | 001, 002 |
| 006 | Genericize `debug.ts`'s `about()` for loaded plugins | No | 005 |
| 007 | Playground: plugin-selection checkbox UI | No | 002, 005 |
| 008 | ADR 0016 — composable artifact plugin system | No | 001, 002, 003, 004, 005 |
| 009 | Gherkin features for Sentry + PostHog plugins | No | 005 |
| 010 | Update M3 PRD to reference `@alistigo/artifact-plugin-api` | Yes | — |

## Dependencies

- None blocking — can start immediately
- Task 010 touches `.agents/prds/alistigo-ai-m3.md`, owned by that PRD's future epic —
  informational update only, does not block or get blocked by that PRD's own work

## Success Criteria (Technical)

- `pnpm build && pnpm build:typecheck` clean across all new/changed packages
- `pnpm nx qa:lint` clean
- New `@artifact-plugins` Gherkin scenarios pass; all pre-existing `@m1`/`@core` scenarios remain green
- Playground: enabling both plugin checkboxes results in both loading via dynamic `import()` from a jsDelivr `@0` URL
- A forced render error shows the existing fallback UI and is reported through the Sentry plugin's `error:uncaught` subscriber
- No plugin failure (missing DSN/key, thrown error in a hook) breaks host mount or another plugin
- `docs/adrs/README.md` index and `.agents/prds/alistigo-ai-m3.md` follow-up note are updated

## Estimated Effort

- Size: L
- Hours: ~24–34

## Tasks Created

- [ ] 001.md - Scaffold @alistigo/artifact-plugin-api (parallel: true)
- [ ] 002.md - Add plugins field to @alistigo/artifact-config-format (parallel: true)
- [ ] 003.md - Scaffold @alistigo/artifact-sentry-plugin (parallel: true)
- [ ] 004.md - Scaffold @alistigo/artifact-posthog-plugin (parallel: true)
- [ ] 005.md - Refactor @alistigo/artifact-list to load plugins (parallel: false)
- [ ] 006.md - Genericize debug.ts's about() for loaded plugins (parallel: false)
- [ ] 007.md - Playground: plugin-selection checkbox UI (parallel: false)
- [ ] 008.md - ADR 0016 — composable artifact plugin system (parallel: false)
- [ ] 009.md - Gherkin features for Sentry + PostHog plugins (parallel: false)
- [ ] 010.md - Update M3 PRD to reference @alistigo/artifact-plugin-api (parallel: true)

Total tasks: 10
Parallel tasks: 4 (001+002 simultaneously; 003+004 simultaneously once 001 lands; 010 anytime)
Sequential tasks: 6
Estimated total effort: 24–34 hours
