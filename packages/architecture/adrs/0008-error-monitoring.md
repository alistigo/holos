---
status: accepted
date: 2026-06-09
deciders: Mikael Labrut
---

# ADR 0008 — Error Monitoring

**Status:** Accepted  
**Date:** 2026-06-09

## Context

The `@alistigo/artifact-list` UMD bundle runs in two environments: the GitHub Pages demo
SPA and Claude HTML artifacts embedded in conversations. In both contexts, JavaScript
errors are currently invisible — they either swallow silently or appear only in the
browser DevTools of the end user, never reaching the developer.

Requirements:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Capture unhandled exceptions and promise rejections | P1 |
| R2 | Capture React component render errors (ErrorBoundary) | P1 |
| R3 | Include release version in every error event | P1 |
| R4 | Source-mapped stack traces | P1 |
| R5 | Works in browser UMD bundle (no Node.js APIs) | P1 |
| R6 | Zero-config silent failure if DSN is absent or CSP blocks outbound | P2 |
| R7 | Can receive pino log entries at `error` level | P2 |

ADR 0007 explicitly noted "Sentry/Datadog transport is a one-liner when we need it"
as a positive consequence of the pino logging decision — this ADR delivers on that.

## Decision

Use **Sentry** (`@sentry/browser` + `@sentry/react`) for error monitoring.

- DSN is baked into the bundle at build time via `VITE_SENTRY_DSN` (absent in dev, set
  in the npm publish CI workflow).
- Sentry initializes once in `src/monitoring.ts`, called from `src/index.tsx` before
  `autoMount()` runs.
- The React app root is wrapped in `<Sentry.ErrorBoundary>` from `@sentry/react`.
- A pino browser transport routes `error`-level log entries to `Sentry.captureException`.
- Source maps are uploaded to Sentry during the npm publish workflow via
  `@sentry/vite-plugin`.

### Claude artifact CSP caveat

Claude artifact sandboxes may block outbound `fetch` to `*.ingest.sentry.io`. If the
CSP rejects the request, the Sentry SDK silently queues and drops events — no user-
visible error, no impact on widget behaviour. This is acceptable: Claude artifacts are
sandboxed evaluation environments; production error data from the GitHub Pages demo and
real web embeds is sufficient signal.

## Rationale

Sentry is the clear choice:

| Criterion | Sentry | Datadog RUM | LogRocket |
|-----------|--------|-------------|-----------|
| Free tier | ✅ 5k errors/month | ❌ paid only | 🟡 1k sessions |
| Browser SDK size | ~25 KB gz | ~50 KB gz | ~40 KB gz |
| React ErrorBoundary | ✅ first-class | 🟡 manual | ✅ |
| Source map upload | ✅ Vite plugin | ✅ | ✅ |
| pino transport | ✅ `pino-sentry` / manual | ❌ | ❌ |
| GDPR / EU hosting | ✅ EU region available | 🟡 SCC | 🟡 SCC |

The pino ecosystem already anticipated Sentry (ADR 0007). The Vite plugin makes source
map upload a one-line `vite.config.ts` addition.

## Consequences

**Positive:**
- Runtime errors in the wild become visible with full stack traces and release tags
- React render crashes show the failing component tree in the Sentry UI
- pino `error` logs flow to Sentry automatically — no duplicate instrumentation
- `RELEASE` env var ties errors to a specific npm version

**Negative / tradeoffs accepted:**
- ~25 KB added to UMD bundle (acceptable — <10% of ~350 KB total)
- DSN is visible in the bundle (standard for public browser SDKs — DSN is rate-limited
  per project, not a secret)
- Silent no-op in Claude artifact CSP context (see above)

## Alternatives considered

- **Datadog RUM** — rejected: no free tier, heavier bundle
- **LogRocket** — rejected: session-replay focus (overkill), limited free tier
- **Custom window.onerror** — rejected: misses React render errors, promise rejections,
  breadcrumbs, and source-map symbolication
