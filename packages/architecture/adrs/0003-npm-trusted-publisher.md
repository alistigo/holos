---
status: superseded
date: 2026-06-10
deciders: Mikael Labrut
superseded_by: "0014"
---

# ADR 0003 — npm Publishing via OIDC Trusted Publisher

**Status:** Superseded by [ADR 0014](0014-npm-token-auth.md)  
**Date:** 2026-06-10

## Context

The Europa monorepo publishes npm packages (e.g. `@alistigo/*`) as part of the automated
CI release job (see ADR 0013). Publishing to npm requires authentication. Two approaches exist:

1. **Long-lived npm token** — a classic `NPM_TOKEN` secret stored in GitHub secrets and
   written to `~/.npmrc`. The token never expires and gives full publish access to the
   account indefinitely.

2. **npm Trusted Publisher (OIDC)** — npm's keyless publishing mechanism. The GitHub
   repository is registered as a trusted publisher on npmjs.com. During a CI run, the
   `npm` CLI exchanges a short-lived GitHub OIDC token for a short-lived npm publish token.
   No secret is stored anywhere.

The original `ci.yml` had placeholder steps for option 1 (`Configure npm auth`, `NPM_TOKEN`
env vars) that were never wired up with a real secret, causing silent publish failures.

## Decision

Use **npm Trusted Publisher (OIDC)** exclusively. No `NPM_TOKEN` secret is stored.
Authentication is handled at publish time via GitHub's OIDC token exchange.

**Registration:** `MLKiiwy/europa` repository → `ci.yml` workflow → Permissions: `npm publish` → Stage: publish.

**CI configuration:**
- `id-token: write` permission on the release job (already set)
- `--provenance` flag on `nx release publish` — this triggers the OIDC exchange
- No `~/.npmrc` token write, no `NPM_TOKEN` or `NODE_AUTH_TOKEN` env vars

## Rationale

| Criterion | Long-lived token | OIDC Trusted Publisher |
|-----------|-----------------|------------------------|
| Credential rotation needed | Yes (manual) | **No — short-lived, auto-rotated** |
| Token compromised impact | Full account publish access forever | **Scoped to this run, expires immediately** |
| Secret management overhead | Store and rotate in GitHub Secrets | **None** |
| Provenance attestation | No | **Yes — signed by GitHub OIDC** |
| npm audit trail | Token identity | **Workflow + repo + commit identity** |

OIDC Trusted Publisher is the npm-recommended approach for CI/CD publishing. It eliminates a
whole class of credential leak risk: even if the CI logs or environment are compromised, the
token is already expired.

## Consequences

**Positive:**
- No stored npm credentials anywhere in the repo or GitHub Secrets
- Publish is tied to a specific workflow + repository + branch — impossible to replay outside CI
- Provenance attestation is automatically generated for every published package
- Complies with npm's recommended security posture for automated publishing

**Negative / tradeoffs accepted:**
- The npm Trusted Publisher registration must be re-configured on npmjs.com if the repo is
  renamed, transferred, or the workflow file is renamed
- Publishing is only possible from the registered workflow — local `npm publish` requires a
  separate PAT or user login

## Alternatives considered

- **Long-lived NPM_TOKEN secret** — rejected: unnecessary credential exposure; token has
  indefinite lifetime and full publish scope; Trusted Publisher is strictly superior
- **Granular access tokens (npm)** — rejected: still requires secret storage and rotation;
  OIDC eliminates this entirely

## References

- [npm Docs: Trusted Publishers](https://docs.npmjs.com/generating-provenance-statements#publishing-with-a-ci/cd-pipeline)
- [GitHub Docs: OIDC in GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
