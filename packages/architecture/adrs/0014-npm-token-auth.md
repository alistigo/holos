---
status: accepted
date: 2026-06-11
deciders: Mikael Labrut
supersedes: "0003"
---

# ADR 0014 — npm Publishing via NPM_TOKEN

**Status:** Accepted (supersedes [ADR 0003](0003-npm-trusted-publisher.md))  
**Date:** 2026-06-11

## Context

ADR 0003 adopted npm Trusted Publisher (OIDC) to eliminate stored credentials and use
short-lived, automatically rotated tokens. In practice, this approach has a fundamental
mismatch with Europa's architecture.

**Root cause — first publish of new packages always fails:**
npm's Trusted Publisher mechanism requires that a package already exists on the registry
before the OIDC exchange is trusted for it. A brand-new package's first `npm publish`
cannot authenticate via OIDC — it is silently rejected. Manual pre-registration on
npmjs.com is required before the package can be published for the first time.

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | First publish of a new package works on the first CI merge with no manual steps | P1 |
| R2 | Adding a new package to the monorepo follows the same flow as any other change | P1 |
| R3 | Credentials are not committed to the repository | P1 |
| R4 | Provenance attestation is retained | P2 |

Europa's core workflow is `add package → commit → merge → auto-publish`. With many
packages and a design goal of a simplified package-creation flow, the OIDC bootstrapping
gate breaks this workflow on every new package.

## Decision

Use a **Granular Access Token (NPM_TOKEN)** stored as a GitHub Actions secret. The token
is passed to the `nx release publish` step via `NODE_AUTH_TOKEN`. Provenance attestation
is retained independently via GitHub OIDC signing (`id-token: write` + `NPM_CONFIG_PROVENANCE`).

**CI configuration:**
- `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` on the publish step
- `NPM_CONFIG_PROVENANCE: true` and `id-token: write` permission retained for provenance
- No `.npmrc` token write required — npm CLI reads `NODE_AUTH_TOKEN` directly

**Token details:**
- Type: Granular Access Token, scope: `publish` on `@alistigo/*`
- Created: 2026-06-11 — rotate before: **2026-09-09**

## Rationale

| Criterion | OIDC Trusted Publisher | **NPM_TOKEN (chosen)** |
|-----------|----------------------|------------------------|
| First-publish of new package | Fails — package must pre-exist on npm | **Works immediately** |
| Manual npmjs.com registration | Required per new package | **None** |
| Monorepo new-package flow | Blocked until manual step | **Unblocked** |
| Credential stored | No | Secret in GitHub Secrets (not in repo) |
| Rotation needed | No | Yes — per token expiry |
| Provenance attestation | Yes (bundled with auth) | **Yes — retained via separate OIDC signing** |

The deciding factor is R1/R2: the OIDC mechanism is theoretically superior on security, but
its bootstrapping requirement breaks the core package-creation workflow. Reliability of the
automated release pipeline takes precedence.

## Consequences

**Positive:**
- First publish of any new package succeeds on the first CI merge, no manual steps
- Adding a new package follows the same workflow as any other code change
- Provenance attestation is preserved — npm packages are still signed
- GitHub Secret is scoped to publish only, not full account access

**Negative / tradeoffs accepted:**
- Token requires manual rotation when it expires (target: before 2026-09-09)
- Token is stored in GitHub Secrets — compromised token has a publish window until rotated
- Rotation process is manual (see checklist below)

## Token Rotation Checklist

When the token approaches expiry, repeat these steps:

1. Go to npmjs.com → Account Settings → Access Tokens → Generate New Token (Granular)
2. Set scope: publish, packages: `@alistigo/*`, expiry: 90 days (or max available)
3. Update the `NPM_TOKEN` secret in the GitHub repository settings
4. Update the **Token details** dates in this ADR

## Alternatives considered

- **OIDC Trusted Publisher** (ADR 0003) — rejected: first publish of new packages always
  fails, requiring manual intervention on npmjs.com per package; breaks the automated
  new-package workflow
- **Classic automation token (no expiry)** — rejected: no expiry increases the blast radius
  of a compromised token; granular tokens with scoped publish access are preferable
