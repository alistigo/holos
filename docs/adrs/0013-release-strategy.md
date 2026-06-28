---
status: accepted
date: 2026-06-10
deciders: Mikael Labrut
---

# ADR 0013 — Release Strategy

**Status:** Accepted  
**Date:** 2026-06-10

## Context

Europa is a personal monorepo with a single developer. The goal is fast iteration with minimal
release ceremony. The repo contains publishable npm packages (`packages/`) and deployed apps
(`apps/`). Every meaningful change should ship as soon as it is validated.

Requirements for the release strategy:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Releases happen automatically — no manual step required | P1 |
| R2 | Version bumps, changelogs, and GitHub Releases are generated from commits | P1 |
| R3 | Only packages affected by a change get version bumps | P1 |
| R4 | QA gates must pass before a release can happen | P1 |
| R5 | Single developer overhead should be minimal | P1 |
| R6 | Recovery from a bad release must be fast | P2 |

## Decision

Any merge to `main` triggers a full `nx release` cycle via GitHub Actions CI:

1. All affected QA checks run (lint, arch-check, typecheck, build, test, fallow audit)
2. If all checks pass, `nx release --skip-publish` runs — bumps versions, generates changelogs,
   creates a GitHub Release and git tag, and pushes a release commit back to `main`
3. `nx release publish` publishes affected packages to npm

No manual release step exists. CI is the only release path.

## Rationale

| Criterion | Manual release | **Automated on merge** |
|-----------|---------------|----------------------|
| Developer overhead | High — must remember to release | **None** |
| Release lag | Minutes to hours | **Seconds after merge** |
| Changelog consistency | Depends on developer | **Generated from commits** |
| Audit trail | Inconsistent | **Every release tied to a CI run** |
| QA gate enforcement | Easy to skip | **Enforced by CI** |

**Why rapid redeploy instead of rollbacks:**

Current apps are client-first (no server, no database). There is no migration to undo, no
in-flight request to protect. A "rollback" is simply:

- **Packages**: pin to a previous semver — all published versions are retained permanently on npm
- **Apps**: re-serve a previous build artifact

A formal rollback mechanism (automated re-deploy of a previous artifact) is intentionally
deferred. Quick fix + redeploy is cheaper to implement and faster to execute for a single
developer. This decision should be revisited when the first stateful app ships.

## Consequences

**Positive:**
- Every PR merge is a release — velocity is maximised
- Changelogs and GitHub Releases are always up to date
- No "I forgot to release" situations
- CI log is the complete audit trail for every release

**Negative / tradeoffs accepted:**
- QA discipline is non-negotiable — a bad test suite directly ships bad code
- Rollback = a new forward commit; there is no automated way to "undo" a release
- The GitHub App bypass on branch protection is a required dependency (see ADR 0002)

## Alternatives considered

- **Manual `nx release` after merge** — rejected: too easy to forget; introduces lag between
  merge and release; single developer workflow doesn't need the extra gate
- **Release branch + release PR** — rejected: overkill for a single developer; adds ceremony
  without safety benefit beyond what CI already provides
- **Semantic Release instead of `nx release`** — rejected: `nx release` is the native Nx tool
  with built-in affected-only support; Semantic Release requires custom per-package config to
  achieve the same thing
