---
status: accepted
date: 2026-06-03
deciders: Mikael Labrut
---

# ADR 0007 — Logging Library

**Status:** Accepted  
**Date:** 2026-06-03

## Context

The Alistigo apps have no structured logging. Errors are either swallowed silently or emitted
through ad-hoc `console.warn` calls scattered across storage repositories. This makes debugging
issues in the artifact tester (and in Claude artifacts at runtime) very difficult — there is no
way to distinguish initialization failures from storage errors from validation errors.

Requirements for the logging library:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Works in browser (no Node.js-only transports) | P1 |
| R2 | Log levels: trace, debug, info, warn, error (and silent) | P1 |
| R3 | Level configurable per environment (prod=error, dev=info, debug=trace) | P1 |
| R4 | Child loggers with bound context (`module`, `listId`, etc.) | P1 |
| R5 | Pluggable output transport (console now, Sentry/Datadog later) | P1 |
| R6 | TypeScript types included | P2 |
| R7 | Small bundle size (goes into the self-contained UMD artifact) | P2 |
| R8 | Active maintenance and large community | P2 |

R4 (child context binding) is the key differentiator — log correlation across a request requires
bound metadata to travel with every log call, not just the initial one.

## Decision

Use **pino** (`pino` on npm) with its browser build.

The shared wrapper package `@alistigo/logger` is a thin adapter that:
- Creates a single root `pino` instance (level `'silent'` by default)
- Exposes `setLogLevel(level)` for app entry points to configure the level at startup
- Exposes `createLogger(module, ctx?)` which returns a `pino` child logger with a bound `module` field

## Rationale

Two candidates were evaluated in depth:

| Criterion | loglevel | **pino** |
|-----------|----------|----------|
| Bundle size (min+gz) | **1.4 KB** | ~3.5 KB |
| Child logger / context binding | ❌ none | ✅ `.child()` |
| Structured JSON output | ❌ string only | ✅ native objects |
| Transport / sink system | 🟡 `methodFactory` | ✅ full ecosystem |
| TypeScript types | ✅ built-in | ✅ built-in |
| Downloads/week | 17.4M | 28.5M |
| Last publish | 1+ year ago | active |

**Why loglevel was rejected despite being smaller:**

1. No child logger / context binding (R4 — P1 miss). Without `.child()`, every log call must
   manually repeat context fields. As the number of modules and operations grows, this becomes
   unmaintainable.
2. `methodFactory` plugin API is awkward. Routing logs to Sentry requires wrapping every method
   individually. pino transports (`pino-sentry`, etc.) are first-class.
3. Dormant project — last published >1 year ago with no roadmap.

The 2.1 KB bundle penalty is accepted. The `@alistigo/artifact-list` UMD is already ~350 KB; adding
pino adds <1% to that size.

## Consequences

**Positive:**
- Context binding via `.child({ module, listId })` makes log correlation trivial across layers
- Structured objects make log parsing/filtering straightforward (browser DevTools, remote tools)
- Sentry / Datadog transport is a one-liner when we need it
- `pino` level semantics include `fatal` (above `error`) for crash-level events
- Active community: known library for the team, no learning curve

**Negative / tradeoffs accepted:**
- ~2 KB larger than loglevel in the UMD bundle (acceptable — <1% of total size)
- pino browser output uses `console.log` with objects; not plain text strings
- `browser: { asObject: true }` means log entries arrive as plain JS objects to the console,
  not pre-formatted strings (actually an advantage for DevTools structured inspection)

## Alternatives considered

- **loglevel** (1.4 KB) — rejected: no child context binding, limited transport, dormant
- **consola** (94 KB) — rejected: excessive bundle size for a UMD artifact
- **tslog** (~25 KB) — rejected: 18× larger than loglevel, limited transport support
- **pino-browser** standalone — same library as pino; pino's own package.json `browser` field
  routes to the browser build automatically when bundled with Vite, so no separate package needed
