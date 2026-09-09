---
status: accepted
date: 2026-09-08
deciders: Mikael Labrut
---

# ADR 0028 — Package-First Repository Structure

**Status:** Accepted
**Date:** 2026-09-08

## Context

Holos is a pnpm + Nx monorepo. Reusable code already lives under `packages/` as
workspace packages, but non-code assets that are *also* reusable, versioned, and
distributable have been landing as bare top-level directories instead — most
recently the CALM architecture models under `architecture/` (ADR 0027 §1).

A bare directory at the repo root has none of the properties that make a package
useful:

- **No version.** There is no way to say "the architecture as of 1.3.0" or to
  tag a breaking change to the model.
- **Not distributable.** Another repo, a docs site, or a CI job cannot depend on
  it without copy-pasting files or pinning a git SHA.
- **No dependency contract.** It cannot declare what it needs (`@finos/calm-cli`,
  a schema version) or what depends on it.
- **Invisible to the toolchain.** Nx does not see it as a project, so it has no
  cached targets, no `affected` wiring, no `qa:*` targets, no place for a
  colocated validation script.
- **Inconsistent.** Contributors have to learn, per directory, whether tasks live
  in a `project.json`, a root script, or nowhere.

The monorepo already has the machinery to give any coherent unit of work all of
those properties for free: a `package.json` + `project.json` pair.

## Decision

### 1. If something can be a package, it is a package

Any self-contained, independently-versionable, potentially-reusable unit of the
repository is a workspace package under `packages/` (or `apps/` / `cli/` when it
is a runnable application or command-line tool). This includes non-TypeScript
units: architecture models, schemas, agent skills, static datasets, doc bundles.

A unit qualifies when **all** of these hold:

- It has an identity someone might refer to by name and version.
- It has a boundary — you can say what is in it and what is not.
- It could plausibly be consumed by more than one other thing (another package,
  a CI job, an external repo, a published site), now or later.
- It has, or will have, its own rules/scripts/checks that belong next to it
  rather than in a shared root pile.

If a unit fails those tests — it is genuinely one-repo, one-consumer, and
throwaway — it stays a plain directory. Prose-only documentation under `docs/`
and `communication/` is explicitly out of scope; those are human-read trees, not
distributable artefacts.

### 2. What "being a package" buys, and is therefore required

Every package created under this rule MUST have:

| Requirement | Why |
|-------------|-----|
| `package.json` with a scoped name (`@alistigo/<name>`) and a semver `version` | Identity + versioning + `workspace:*` referenceability |
| `project.json` as the single source of truth for Nx targets (per CLAUDE.md) | Cached tasks, `affected`, `dependsOn`, colocated `qa:*` |
| A `README.md` describing what it is and how to consume it | Discoverability |
| `LICENSE` (copied from repo root) | Distribution hygiene |
| An explicit `files` array + `publishConfig` when it is meant to be published | Controls the published surface |
| Its own validation / lint / build scripts colocated in the package | Rules travel with the thing they govern |

A package that is not meant for npm sets `"private": true`; the default for
genuinely reusable units is publishable.

### 3. Consequence for the CALM architecture model

`architecture/` at the repo root moves to `packages/architecture/`, published as
**`@alistigo/architecture`**. It gains:

- a `version` (starts at `0.1.0`)
- `project.json` with a `qa:arch-calm` target (was `scripts/validate-architecture.sh`
  + a root `package.json` script)
- a colocated `scripts/validate.sh`
- its README, patterns, and systems unchanged in content, moved wholesale

This amends **ADR 0027 §1** ("stored under `architecture/` at the repo root").
The path is now `packages/architecture/`; everything else in ADR 0027 stands.

New structure:

```
packages/architecture/
├── package.json              # @alistigo/architecture
├── project.json              # Nx targets: qa:arch-calm, qa:lint, clean
├── README.md
├── scripts/
│   └── validate.sh           # was scripts/validate-architecture.sh
├── patterns/
│   ├── ddd-hexagonal.pattern.json
│   └── event-sourcing-cqrs.pattern.json
└── systems/
    ├── alistigo-platform.arch.json
    ├── list-artifact-ddd.arch.json
    ├── monorepo-toolchain.arch.json
    ├── monorepo-packages.arch.json
    └── alistigo-artifact-concept.arch.json
```

### 4. Migration procedure (applies to this and future promotions)

1. `git mv <dir> packages/<name>` — move tracked files, preserving history.
2. Add `package.json` (scoped name, `version`, `files`, `publishConfig` or
   `"private": true`), `project.json` (targets), copy `LICENSE`.
3. Move any root-level scripts that only served this dir into the package; make
   their paths package-relative.
4. Repoint root `package.json` scripts / `nx run-many` aggregates at the new Nx
   target (`nx run <name>:<target>`), and delete the superseded root script.
5. Grep the repo for the old path (docs, ADRs, agent commands/skills, CI) and
   update every reference.
6. `pnpm install` to relink the workspace; run the package's own checks.

## Consequences

**Positive:**
- One consistent answer to "where do tasks live" — always `project.json`.
- The architecture model is versionable and `workspace:*`-referenceable; a future
  `cli/calm-to-archify` or docs build can depend on `@alistigo/architecture`.
- Nx `affected` now covers architecture changes; `pnpm qa` runs
  `architecture:qa:arch-calm` automatically.
- Sets the precedent for promoting agent skills, schemas, and datasets the same
  way.

**Negative / trade-offs:**
- More `package.json` / `project.json` boilerplate for small units.
- A publishable `@alistigo/architecture` enters the `nx release` set — a new
  version can be published on release even though consumers are internal today.
- Every promotion is a path change with a repo-wide reference sweep (step 5).

**Neutral:**
- `docs/` and `communication/` stay as plain trees — this rule is about
  distributable artefacts, not all files.
- No change to the CALM decision itself (ADR 0027); only where the files sit.

## References

- [ADR 0027](0027-architecture-as-code-calm.md) — Architecture as Code: CALM (amended by this ADR, §1 path)
- [ADR 0026](0026-alistigo-document-format-jsonld-schemaorg.md) — document format as a package standard (same package-first instinct)
- [ADR 0015](0015-agent-skills-standard.md) — agent skills standard (candidate for future promotion)
- `CLAUDE.md` → "Nx Task Convention" — `project.json` is the single source of truth for tasks
- `scripts/new-package.sh` — package scaffold
