---
status: accepted
date: 2026-06-09
deciders: Mikael Labrut
---

# ADR 0010 — Product Analytics

**Status:** Accepted  
**Date:** 2026-06-09

## Context

There is currently no visibility into how the Alistigo widget is used: how many times
it is displayed, how many unique users (sessions) exist, or what actions they perform.
This data is needed to make product decisions for M2 and beyond.

Requirements:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Count widget displays (pageview equivalent) | P1 |
| R2 | Unique user / session identification (anonymous) | P1 |
| R3 | GDPR-compliant — no consent banner required | P1 |
| R4 | Free tier sufficient for a small indie project | P1 |
| R5 | Works in browser UMD bundle | P1 |
| R6 | Custom event tracking (list created, item added, etc.) | P2 |
| R7 | Silent no-op if CSP blocks outbound (Claude artifact) | P2 |

### Claude artifact CSP caveat

Like Sentry (ADR 0008), outbound fetch to PostHog endpoints may be blocked by Claude
artifact CSP. Analytics will work on GitHub Pages and real web embeds; Claude artifact
context is best-effort. This is acceptable: the primary analytics signal comes from
real-web usage.

## Decision

Use **PostHog** (`posthog-js`) with the EU cloud.

- API key baked into bundle via `VITE_POSTHOG_KEY`.
- PostHog initializes in `src/analytics.ts` with `persistence: "memory"` (no cookies,
  no localStorage write — avoids GDPR consent requirement).
- Tracks one event on every `mount()` call: `widget_displayed` with properties
  `{ locale, storageType, version }`.
- PostHog's EU endpoint (`https://eu.i.posthog.com`) ensures data residency in the EU.

## Rationale

| Criterion | PostHog EU | Plausible | Umami (cloud) | Mixpanel |
|-----------|------------|-----------|----------------|----------|
| Perpetual free tier | ✅ 1M events/month | ❌ trial only | 🟡 limited | ✅ 1M events |
| Anonymous session ID | ✅ auto | ✅ daily hash | ✅ | ✅ |
| Custom events | ✅ | ❌ pageviews only | ✅ | ✅ |
| No-cookie mode | ✅ `memory` persistence | ✅ | ✅ | 🟡 requires config |
| GDPR / EU data residency | ✅ EU cloud | ✅ EU-only | 🟡 cloud location varies | 🟡 SCC |
| TypeScript SDK | ✅ | 🟡 manual | 🟡 | ✅ |
| Bundle size (gz) | ~22 KB | ~3.5 KB | ~2 KB | ~30 KB |

Plausible was rejected despite its tiny size because it tracks pageviews only — no
custom events, and "who are these users" is limited to daily hash-based counts with no
session continuity.

Umami was considered but the self-hosted requirement adds infrastructure complexity
for an indie project with zero ops budget.

PostHog's `memory` persistence mode (no cookies, no localStorage) means the widget
requires no GDPR consent banner for analytics — user is anonymous, no PII stored,
data stays in EU.

## Consequences

**Positive:**
- Real-time dashboard: display count, unique sessions, geographic distribution
- Custom events enable funnel analysis (display → first item added → list saved)
- No consent banner needed (`memory` mode, no PII, EU residency)
- 1M events/month free — sufficient for current scale
- TypeScript types included in `posthog-js`

**Negative / tradeoffs accepted:**
- ~22 KB added to UMD bundle (acceptable — same order as Sentry, <10% of total)
- `memory` persistence means session ID resets on page reload (acceptable for
  display-count use case — each reload is a new display event anyway)
- Silent no-op in Claude artifact CSP context (see above)

## Alternatives considered

- **Plausible** — rejected: no custom events, no cross-reload session continuity
- **Umami self-hosted** — rejected: requires infrastructure maintenance
- **Mixpanel** — rejected: no EU data residency guarantee without enterprise plan
- **Google Analytics** — rejected: requires consent banner, sends PII to US servers
