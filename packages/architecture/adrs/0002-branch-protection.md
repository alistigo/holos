---
status: accepted
date: 2026-06-10
deciders: Mikael Labrut
---

# ADR 0002 — Branch Protection & Security

**Status:** Accepted  
**Date:** 2026-06-10

## Context

`main` is the production branch. Every commit on `main` can trigger an automated release (see
ADR 0013). Without protection, a direct push or force-push could:

- Ship unreviewed code directly to production
- Corrupt the linear release history that `nx release` depends on for changelog generation
- Overwrite the release commit that CI pushes back after `nx release`

At the same time, the automated release process itself needs to push a commit back to `main`
(the `chore(release): ...` bump commit and tags). This creates a tension: strict branch
protection blocks the automation that releases require.

## Decision

A GitHub Ruleset is applied to `main` with the following rules:

| Rule | Setting |
|------|---------|
| Require a pull request | ✅ enabled — all changes must go through a PR |
| Block force pushes | ✅ enabled — release history is immutable |
| Require status checks to pass | ✅ enabled — CI must green before merge |
| Required checks | `affected` job (lint, arch-check, typecheck, build, test, fallow audit) |
| Bypass list | MLKiiwy GitHub App only |

The **MLKiiwy GitHub App** is a dedicated GitHub App installed on this repo and associated with
the MLKiiwy account. Its sole purpose is to allow the CI release job to push the version bump
commit and tags back to `main` without triggering another CI run (commits from the app identity
are excluded from the release trigger by a `chore(release):` prefix check in `ci.yml`).

Reference: [Letting GitHub Actions push to protected branches — NinjaNeers](https://medium.com/ninjaneers/letting-github-actions-push-to-protected-branches-a-how-to-57096876850d)

## Rationale

| Criterion | No protection | Branch protection + App bypass |
|-----------|--------------|-------------------------------|
| Accidental direct push to prod | Possible | **Blocked** |
| Force-push corrupting history | Possible | **Blocked** |
| CI required before merge | Optional | **Enforced** |
| Automated release commits | Works | **Works via narrow bypass** |
| Bypass auditability | N/A | **GitHub audit log captures every bypass** |

**Why a GitHub App instead of a Personal Access Token (PAT):**

GitHub Apps have finer-grained permissions and are tied to a machine identity, not a personal
account. If the personal account loses repo access, a PAT stops working; the App continues to
function independently. Apps are also the recommended approach by GitHub for automation on
protected branches.

**Why only one bypass identity:**

The bypass list should be as small as possible. Every identity on the bypass list is a vector
for unreviewed code to reach `main`. One identity = one attack surface = easy to audit and revoke.

## Consequences

**Positive:**
- Every production change is reviewed (by CI at minimum; by a human in the future)
- Force-push protection preserves the linear history that `nx release` relies on
- The bypass is narrow, intentional, and auditable — not a blanket workaround
- New bypass identities require a conscious decision and an update to this ADR

**Negative / tradeoffs accepted:**
- Adding the GitHub App to the repo requires setup on a new machine or after account changes
- Emergency hotfixes still go through a PR — there is no "break glass" direct push path

## Future considerations

- **AI code review as a required reviewer:** As the project matures, requiring review from an
  AI model (e.g. GitHub Copilot, a Claude Code agent) before merge is a sound practice for
  AI-assisted development. Cross-model review catches issues that any single model may miss.
  This can be configured as a required GitHub Actions check or a required reviewer rule.
- **Human code review:** Add a required human reviewer when the team grows beyond a single
  developer. The ruleset is already structured to accept additional required checks with no
  architectural change.

## Alternatives considered

- **No branch protection** — rejected: direct push risk is unacceptable given automated releases
- **Branch protection with PAT bypass** — rejected: PATs are tied to personal accounts and have
  coarser permissions than GitHub Apps; recommended against by GitHub for automation use cases
- **Disable release automation to avoid bypass** — rejected: manual releases contradict ADR 0013
  (R1: releases happen automatically)
