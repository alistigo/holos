---
status: accepted
date: 2026-06-12
deciders: [Mikael Labrut]
---

# ADR 0011 — jsDelivr CDN Versioning Strategy

**Status:** Accepted  
**Date:** 2026-06-12

## Context

Alistigo widgets are distributed via the `@alistigo/artifact-manager` npm package and served to
Claude HTML artifacts through jsDelivr CDN (see ADR 0004 for why jsDelivr is mandatory —
Claude's `script-src` CSP allowlist explicitly includes `cdn.jsdelivr.net/npm/`).

Previous documentation used `@latest` in CDN URLs. This was a mistake: jsDelivr does not have
a `@latest` specifier. The version-less equivalent in jsDelivr URLs is simply omitting the
version entirely (e.g. `/npm/@alistigo/artifact-manager/dist/index.umd.js`). jsDelivr
explicitly marks this pattern as **not recommended for production usage**:

> "Requesting the latest version (as opposed to 'latest major' or 'latest minor') is dangerous
> because major versions usually come with breaking changes."

The project is currently in 0.x beta. The recommended jsDelivr pattern for this stage is a
**major version pin** (`@0`), which auto-includes all 0.x.y patch and minor updates while
stopping at a future 1.0 boundary.

## Decision

All jsDelivr URLs for `@alistigo/artifact-manager` use a major version pin:

```
https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js
```

npm is the primary registry. jsDelivr can also serve from GitHub as a documented fallback:

```
https://cdn.jsdelivr.net/gh/mlkiiwy/europa@main/...
```

The GitHub CDN path is a fallback only — npm is canonical and the recommended integration path.

## Rationale

| Versioning strategy | Auto patch/minor updates | Protected from major breaks | jsDelivr recommended |
|---------------------|--------------------------|-----------------------------|-----------------------|
| No version (version-less URL) | ✅ (but dangerous) | ❌ | ❌ — "not recommended for production" |
| `@0.x.y` (pinned patch) | ❌ | ✅ | ❌ |
| **`@0` (major pin)** | **✅** | **✅** | **✅** |

`@0` aligns with jsDelivr's documented recommendation to use version ranges.
When the project ships v1.0, all existing `@0` URLs continue to work unchanged — consumers
opt in to v1 explicitly by updating their script tag.

npm is preferred over GitHub CDN because:
- npm is the authoritative source of truth for the package
- jsDelivr's npm mirror has better global caching infrastructure than the GitHub CDN path
- GitHub CDN requires branch or tag tracking, which complicates release isolation

## Consequences

**Positive:**
- Artifacts automatically receive bug fixes and new features within the 0.x API contract
- Upgrading to v1.0 is an explicit, intentional action — consumers must update the URL
- Documentation is clear and unambiguous about the distribution model

**Negative / tradeoffs accepted:**
- CDN propagation delay (10–30 min) still applies after each npm publish
- The `@0` range could include a regression in a 0.x patch — mitigated by the test suite and staged publishing

## Alternatives considered

- **Version-less URL (no version specifier)** — rejected: jsDelivr marks this as not recommended for production; dangerous when a future v1.0 is published
- **Pinned patch `@0.x.y`** — rejected: requires manual doc updates on every release; consumers miss patches
- **GitHub CDN primary** — rejected: npm is more reliable and canonical; GitHub CDN documented as fallback only
