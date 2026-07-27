# Plugin Type Taxonomy

All `@alistigo` plugins implement the `AlistigoPlugin` interface from
`@alistigo/artifact-plugin-api` (see [ADR 0016](../adrs/0016-artifact-plugin-system.md)).
The plugin type determines what the plugin does, not how it's wired — the interface
is the same for all types.

---

## Type Overview

| Type | Purpose | Lifecycle hooks used | Key interface fields | Examples |
|------|---------|---------------------|---------------------|---------|
| **infra** | Monitoring, analytics, cross-cutting concerns | `setup`, `mounted`, event bus | — | `sentry-plugin`, `posthog-plugin` |
| **domain** | Data-shape extensions, render contributions, new commands/events | All hooks | `dataShape`, `render`, `commands`, `events` | `checkbox-element` (M3) |
| **storage** | Document persistence backends | `setup` | `isAvailable()`, `createStore()` | `claude-storage-plugin`, `local-storage-plugin` |
| **auth** | User identity + authentication | All hooks | `@experimental AuthPlugin` | (planned — no implementation in P0) |

---

## Infra Plugins

Infra plugins add cross-cutting concerns without touching the artifact's domain logic.
They hook into lifecycle events and/or react to the event bus.

**Pattern:**
```ts
export default {
  name: "@alistigo/artifact-sentry-plugin",
  async setup(ctx) {
    Sentry.init({ dsn: ctx.config["@alistigo/artifact-sentry-plugin"]?.dsn });
    ctx.on("error:uncaught", ({ error }) => Sentry.captureException(error));
  },
} satisfies AlistigoPlugin;
```

**Current infra plugins:**
- `@alistigo/artifact-sentry-plugin` — Sentry error monitoring (ADR 0008)
- `@alistigo/artifact-posthog-plugin` — PostHog analytics (ADR 0010)

---

## Domain Plugins

Domain plugins extend the artifact's data model and UI. They add new element types,
commands, events, and render contributions. This is the pattern used for M3's
`checkbox-element` plugin.

**Pattern (sketch — M3 will finalize):**
```ts
export default {
  name: "@alistigo/plugin-checkbox-element",
  dataShape: CheckboxElementSchema,     // extends the document's element schema
  render: {
    elementColumn: CheckboxColumn,      // React component injected into element rows
  },
  commands: {
    completeElement: async (ctx, { elementId }) => { ... },
  },
  events: {
    ElementCompleted: (ctx, event) => { ... },   // projector contribution
  },
} satisfies AlistigoPlugin;
```

**Planned domain plugins:** `checkbox-element` (M3), plus plugins for M4's second list type.

---

## Storage Plugins

Storage plugins implement document persistence backends. They must implement:
- `isAvailable(): Promise<boolean>` — whether this backend is usable in the current context
- `createStore(): ListStore` (or the artifact-agnostic equivalent in future)

At boot, the artifact's startup sequence calls `isAvailable()` on each loaded storage
plugin in order and uses the first one that returns `true`.

**Current storage plugins:**
- `@alistigo/claude-storage-plugin` — `window.storage` (Claude artifact context) — ADR 0005/0017
- `@alistigo/local-storage-plugin` — `localStorage` (standard browser)

**Fallback:** `InMemoryStore` — used when no storage plugin is available; data is lost on reload.

See [ADR 0017](../adrs/0017-storage-plugin-system.md) for the storage plugin system design.

---

## Auth Plugins (Planned)

Auth plugins will authenticate the user and associate a name + avatar with every artifact
session. This makes user attribution possible for AI-driven changes ("the AI renamed the
list on behalf of Alice").

**Status:** Not implemented in P0. A `AuthPlugin` type stub is exported from
`@alistigo/artifact-core` (marked `@experimental`).

**Planned interface (subject to change):**
```ts
// @experimental
export interface AuthPlugin extends AlistigoPlugin {
  getIdentity(): Promise<{ name: string; avatarUrl?: string }>;
  isAuthenticated(): Promise<boolean>;
}
```

The auth plugin type will be formally specified in a future ADR before implementation.

---

## Plugin Distribution

All plugins are:
- Independent npm packages at `@alistigo/*`
- Built as bundled, dependency-free ESM bundles
- Loaded at runtime from jsDelivr CDN using the `@0` major-version-pin convention (ADR 0011)
- Never bundled into the artifact at build time (enabling/disabling is a config change)

See [ADR 0016](../adrs/0016-artifact-plugin-system.md) for distribution details.
