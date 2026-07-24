---
status: accepted
date: 2026-07-24
deciders: Mikael Labrut
amends: "0016"
supersedes: "0005"
---

# ADR 0017 — Storage Plugin System

**Status:** Accepted
**Date:** 2026-07-24
**Amends:** ADR 0016 (extends the plugin type system)
**Supersedes:** ADR 0005 (storage detection no longer lives in the host)

## Context

ADR 0005 introduced two storage backends — `@alistigo/claude-storage-plugin` (backed
by Claude's `window.storage` API) and `@alistigo/local-storage-plugin` (backed by
`window.localStorage`) — and put the detection logic (which backend is available?) in
`App.tsx` itself: `isClaudeArtifactContext()` was called at boot time and the result
wired a concrete repository class directly into the component tree.

ADR 0016 established a composable plugin system for infra/lifecycle concerns (Sentry,
PostHog) where each plugin ships as an independently-versioned npm package, loads from
jsDelivr at runtime, and runs through `createPluginRuntime()` lifecycle hooks. That
round left storage on the old path — a hard import inside `App.tsx`, context-detection
logic in the host, and two storage packages that `artifact-list` had to depend on at
build time.

Three problems with the current arrangement:

1. **Tight coupling.** `App.tsx` imports from `@alistigo/claude-storage-plugin` and
   `@alistigo/local-storage-plugin`. Adding or replacing a storage backend requires
   touching the host.
2. **Detection logic in the wrong place.** The host knows which backend to use. A
   plugin system should let the plugin declare its own availability.
3. **Not extensible.** A future storage backend (IndexedDB, remote API) would need
   another branch in `App.tsx`, not a new plugin package.

Storage backends fit the plugin model naturally: they are independently deployable,
their availability is self-determined (`isAvailable()`), and the host only needs to
know which one won.

## Decision

### Plugin type field

`AlistigoPlugin` gains an optional `type` field:

```ts
export interface AlistigoPlugin {
  name: string;
  type?: "monitoring" | "storage" | (string & {});
  // … existing lifecycle hooks unchanged …
}
```

`type` is informational metadata — it enables type-based plugin queries (e.g.,
`resolveStore()`) without coupling the runtime to any specific plugin package. The
open `(string & {})` tail lets future plugin types extend the union in a config
document without requiring a package update. Plugins with no type are still valid;
the field is optional.

### Storage extension interface

Storage plugins extend `AlistigoPlugin` with a `storage` property:

```ts
export interface AlistigoStorageExtension extends AlistigoPlugin {
  type: "storage";
  storage: {
    isAvailable(): boolean;
    createStore(listId: string): ListStore;
    listKeys(): Promise<string[]>;
    seedIfEmpty?(store: ListStore): Promise<void>; // optional
  };
}
```

`isAvailable()` is synchronous — it must not block the resolution loop. `createStore()`
returns a `ListStore` for a given list identifier. `listKeys()` supports future
multi-list enumeration. `seedIfEmpty()` is an optional hook for plugins that want to
pre-populate a new store (e.g., from a shared artifact URL).

### Plugin spec injection

`mount()` calls `buildPluginSpec(userSpec)` before `loadPlugins()`. That helper
injects the two default storage plugins at the **front** of the spec, unless the user
has already listed them:

```
[
  "@alistigo/claude-storage-plugin",   // first, preferred
  "@alistigo/local-storage-plugin",    // second, fallback
  ...userSpec plugins
]
```

Injection order is intentional: the Claude backend is preferred because it is the only
persistent storage available inside a Claude artifact. Placing defaults at the front
means a user-provided storage plugin listed in the spec comes third — and can only win
if neither default is available. A user who wants to override can explicitly exclude
the defaults by listing their own storage plugin before the defaults would appear, or
the injection logic can be suppressed via a future escape hatch if a concrete need
arises.

Both plugins are CDN-loaded via jsDelivr, following ADR 0016's `@0` major-version-pin
convention:

```ts
const url = `https://cdn.jsdelivr.net/npm/${packageName}@0/dist/index.js`;
const { default: plugin } = await import(/* @vite-ignore */ url);
```

This means storage backends are never bundled into `@alistigo/artifact-list` at build
time — enabling or changing a storage backend is a config change, not a rebuild.

### Store resolution

After `loadPlugins()` completes, `resolveStore(plugins)` selects the active backend:

```ts
function resolveStore(plugins: AlistigoPlugin[]): ListStore | null {
  for (const p of plugins) {
    if (p.type === "storage" && (p as AlistigoStorageExtension).storage?.isAvailable()) {
      return (p as AlistigoStorageExtension).storage.createStore(listId);
    }
  }
  return null;
}
```

**Priority = insertion order.** The first plugin in the resolved list where
`type === "storage"` and `isAvailable() === true` wins. No scoring, no
weighting — first match takes it.

### In-memory fallback

If `resolveStore()` returns `null` (no storage plugin loaded, or no plugin reports
itself available), the artifact falls back to `InMemoryListStore` — a plain
`Map`-backed implementation with no persistence. No error is thrown; the app starts
normally. Data is lost on page reload. This is acceptable: the fallback is a last
resort, and the CDN-load failure path (storage plugin fails to load) is already
individually try-caught by `createPluginRuntime()` per ADR 0016 R3.

## Rationale

| Criterion | Detection in App.tsx (prior art) | Storage as plugin (chosen) |
|-----------|----------------------------------|----------------------------|
| `App.tsx` free of storage package imports | ❌ | ✅ |
| Adding a new backend requires host change | ✅ yes, always | ❌ config only |
| Plugin declares its own availability | ❌ host does it | ✅ |
| CDN-load failure is isolated | ❌ breaks mount | ✅ (try-caught, falls to in-memory) |
| Consistent with ADR 0016 extension model | ❌ | ✅ |

Detection in `App.tsx` was the simplest option when only two backends existed and
no plugin system was in place. With ADR 0016 establishing the pattern, keeping storage
on the old path would create a permanent inconsistency: monitoring plugins are
CDN-loaded, storage plugins are build-time bundled. Moving storage into the same model
closes that gap and makes the extension points uniform.

## Consequences

**Positive:**

- `App.tsx` has zero imports from storage packages after this change.
- A new storage backend requires only a new plugin package and a config entry — no
  changes to `artifact-list`.
- CDN failure on a storage plugin degrades gracefully to the in-memory fallback;
  it does not prevent the artifact from mounting.
- `type` on `AlistigoPlugin` enables type-based plugin queries today and leaves a
  clean extension point for future plugin categories (e.g., `"sync"`, `"auth"`).
- `@alistigo/claude-storage-plugin` and `@alistigo/local-storage-plugin` version
  independently of `artifact-list` and of each other.

**Negative / tradeoffs accepted:**

- Storage plugins load from CDN; in a network-constrained environment, there is
  a latency window before the store is resolved. The in-memory fallback covers the
  failure case but not the latency case — the artifact waits for `loadPlugins()`
  before rendering.
- `buildPluginSpec()` injects defaults silently. A developer who forgets the injection
  exists may be confused by storage plugins appearing in the resolved list without
  being in their config document. This is mitigated by documentation and by the fact
  that the injection is the only place default plugins are added.
- The `type` field is informational only — it is not enforced at runtime. A plugin
  that sets `type: "storage"` but omits `storage` will cause `resolveStore()` to
  skip it (guard on `storage?.isAvailable()`), but no error is surfaced at load time.
- `seedIfEmpty()` is optional and its call site is left to the host's discretion;
  this ADR does not mandate when or whether it is invoked.

## Alternatives considered

- **Keep detection in App.tsx** — rejected: doesn't scale to additional backends,
  couples the host to specific storage packages, and creates an inconsistency with
  the CDN-loaded monitoring plugins established by ADR 0016.
- **Single `AlistigoStoragePlugin` type (no union)** — rejected: the `type` field
  serves a broader purpose (future plugin categories, type-based queries) and was
  designed as an open union from the start. A storage-only type would need to be
  refactored the moment a second non-storage category arises.
- **Scored / weighted priority** — rejected: unnecessary complexity for a two-plugin
  default. Insertion-order priority is transparent and predictable; the host controls
  order by controlling `buildPluginSpec()`.
- **Mandatory storage plugin (no in-memory fallback)** — rejected: it would make CDN
  failure a hard error, violating the spirit of ADR 0016 R3 (one plugin failing never
  breaks the host mount). An in-memory store preserves the invariant.
