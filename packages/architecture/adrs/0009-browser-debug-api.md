---
status: accepted
date: 2026-06-09
deciders: Mikael Labrut
---

# ADR 0009 — Browser Debug API

**Status:** Accepted  
**Date:** 2026-06-09

## Context

`@alistigo/artifact-list` is a self-contained UMD bundle distributed via CDN. When embedded
in a Claude artifact or a third-party page, there is no build toolchain visible to the
person debugging. Developers (and AI assistants writing Claude artifacts) need a way
to inspect:

- Which version of the library is running
- Which locale and dependencies are bundled
- What runtime state exists (storage type, mounted containers, log level)
- Whether monitoring and analytics are active

Currently this requires reading the source, which is minified and bundled.

## Decision

Expose two functions on the UMD global `Alistigo`:

```ts
Alistigo.version()
// → { version: "0.1.3", locale: "en", buildTime: "2026-06-09T...",
//     dependencies: { react: "19.2.5", pino: "9.x", ... } }

Alistigo.about()
// → all of version() plus:
//   runtime: { storageType: "window.storage" | "localStorage" | "none",
//               mountedContainers: ["#app"],
//               logLevel: "error" }
//   monitoring: { sentry: { enabled: true, release: "0.1.3" } }
//   analytics:  { posthog: { enabled: true, host: "https://eu.i.posthog.com" } }
```

Both functions print to `console.log` AND return the object, so they work both
interactively (type in DevTools console) and programmatically.

## Rationale

- The pattern is established by other browser libraries (e.g. `React.version`,
  `monaco.editor.getVersion()`)
- Zero runtime cost when not called — the data is static metadata
- Exposed on the existing `Alistigo` global (no new global namespace pollution)
- `about()` is a superset of `version()` — simple mental model

## Consequences

**Positive:**
- Paste `Alistigo.version()` in DevTools → immediately know which build is running
- AI assistants generating Claude artifacts can call `Alistigo.about()` to self-diagnose
- Monitoring and analytics status visible without reading source

**Negative / tradeoffs accepted:**
- Dependency versions are baked at build time — they reflect the build, not runtime
  state (acceptable: UMD bundle has no runtime package resolution)

## Alternatives considered

- **`Alistigo.__version__` string** — rejected: single string loses dependency context
- **Custom event / DOM attribute** — rejected: not accessible from console,
  requires DOM manipulation
