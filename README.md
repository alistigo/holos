# Holos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/maintained_with-pnpm-cc00ff.svg?logo=pnpm)](https://pnpm.io/)
[![Built with Nx](https://img.shields.io/badge/Built_with-Nx-143157?logo=nx)](https://nx.dev)

Alistigo main monorepo. Apps, libraries, Docker containers, documentation, ... — all in one place.

## Structure

| Directory | Purpose |
|-----------|---------|
| `apps/` | Runnable applications — CLI tools, web servers, desktop apps |
| `packages/` | Reusable libraries, publishable to npm / GitHub Packages |
| `docs/` | Project documentation — plans, goals, architecture docs (no code) |
| `ai/` | Agents AI skills, commands (source of truth), and persistent memory |

## Setup

```sh
bash scripts/setup.sh
```

The script installs mise (if needed), wires shell activation for zsh/bash/sh, installs Node dependencies, and sets up Claude tooling.

## Common Commands

```sh
pnpm build              # Build all packages
pnpm build:typecheck    # Type-check all packages
pnpm test               # Run all tests
```

## Quality Assurance

All static analysis and linting tools follow the `qa:*` prefix — keeping QA commands grouped and discoverable, separate from build/run/test commands.

| Script | Tool | What it checks |
|--------|------|----------------|
| `pnpm qa` | All QA tools | Run all `qa:*` checks in parallel |
| `pnpm qa:lint` | [Biome](https://biomejs.dev/) | Code style, formatting, and lint rules across all packages |
| `pnpm qa:arch-check` | [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | Architectural boundary violations — see `docs/arch-check.md` |
| `pnpm qa:dead-code` | [Fallow](https://github.com/fallow-rs/fallow) | Unused files, exports, and dead code (full repo scan) |
| `pnpm qa:audit` | [Fallow](https://github.com/fallow-rs/fallow) | Changed-file risk gate — fast audit for pre-push and CI |
| `pnpm build:typecheck` | TypeScript | Type correctness across all packages |
| `pnpm test` | Bun test / Playwright | Unit, integration, and end-to-end tests |

All `qa:*` checks run automatically:
- **Pre-push** (via lefthook): `qa:lint`, `qa:arch-check`, `qa:audit` — blocks the push if any fail
- **CI on PRs**: `qa:lint`, `qa:arch-check`, and fallow audit with inline PR annotations
- **Weekly CI (full scan)**: all of the above plus `qa:dead-code` against the entire repo

## Documentation

| Doc | What it covers |
|-----|----------------|
| [docs/sdlc.md](docs/sdlc.md) | AI-augmented SDLC philosophy — lifecycle stages, AI touchpoints per stage, human review gates, agent orchestration patterns |
| [docs/arch-check.md](docs/arch-check.md) | Architectural boundary rules enforced by dependency-cruiser |
| [docs/adrs/](docs/adrs/) | Architecture Decision Records — why the repo is shaped the way it is |

## Publishing Packages

Packages under `packages/` are scoped to `@alistigo/*` and published to NPM.

```sh
nx release --projects=packages/<name>
```

## Continuous Deployment

Every merge to `main` automatically triggers a full release cycle via `nx release`: version bumps, changelog generation, GitHub Releases, and npm publishing for all affected packages and apps. **If CI passes, it ships.**

The QA pipeline is the confidence layer — lint, arch-check, dead-code audit, typecheck, build, and tests all run on every PR. Passing those gates is the definition of "ready to release."

**On rollbacks:** current apps are client-first (no server, no database). Rolling back means pointing to a previous published version — all npm package versions are retained permanently, and previous app build artifacts can be re-served. A formal rollback mechanism for apps is deferred; quick fix + redeploy is the current recovery strategy. A structured rollback system becomes important as the project grows to include stateful apps.

**For unknown bugs that slip through:** error monitoring and observability catch them in production. The response is a rapid new commit + redeploy, not a revert.

See [docs/adrs/0001-release-strategy.md](docs/adrs/0001-release-strategy.md) and [docs/adrs/0002-branch-protection.md](docs/adrs/0002-branch-protection.md) for the architectural rationale behind these choices.
