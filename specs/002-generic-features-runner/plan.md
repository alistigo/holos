# Implementation Plan: Generic Artifact Features Runner

**Branch**: `feat/002-generic-features-runner` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

## Summary

Introduce a new `artifact-features-runner-playwright` CLI that runs any `@alistigo/*-features` package's Gherkin scenarios against a configurable playground host. Migrate `list-features` to the new `features` package type by moving its step definitions into the package itself and adding the required metadata. Extend `artifact-arch-check` with a new `features` subcommand that validates features packages workspace-wide.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 22 (Bun as runtime)

**Primary Dependencies**:
- `@cucumber/cucumber` ^12 (runner), `playwright` ^1.6x (browser automation)
- `clipanion` (CLI framework — matches `artifact-arch-check` and project convention)
- `ink` + React (CLI output — matches arch-check pattern)

**Storage**: N/A

**Testing**: Bun test for unit tests (arch-check check logic); integration via the runner's own Nx `test:list` target against a live playground

**Target Platform**: Local developer workstation + CI (Linux)

**Project Type**: 2 CLIs (`artifact-features-runner-playwright` as new, `artifact-arch-check` extended) + 1 package migration (`list-features`) + 1 package deletion (`list-features-runner-playwright`)

**Performance Goals**: Full list-features run in <60 seconds against a local playground (matches existing runner)

**Constraints**: Zero behavioral regression in list-features Gherkin scenario results

**Scale/Scope**: 2 existing features packages in-scope for validation (`list-features`, `artifact-ai-draw-comments-features`); `list-features` is fully migrated; `artifact-ai-draw-comments-features` is validated by arch-check but not refactored

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| **I. Package-First Architecture** | ✅ New runner is a proper package in `cli/`; `list-features` gains `alistigo` metadata; both have `project.json` and `package.json` |
| **II. Four-Tier Platform** | ✅ `features` packages are Tier 4 (Dev Tools); runner is infrastructure; no Artifact Contract applies to either |
| **III. DDD + Event Sourcing** | ✅ Not applicable — features packages test behavior, they don't own domain state |
| **IV. TDD via Gherkin + Storybook** | ✅ This feature IS the Gherkin infrastructure; no new UI components added |
| **V. Architecture as Code (CALM)** | ✅ No new CALM model needed for this iteration (runner is infra tooling, not a user-facing artifact) |
| **Package Metadata (ADR-0031)** | ✅ New `"features"` type added to metadata schema; `list-features` gains `alistigo.domain` field |
| **Toolchain** | ✅ Clipanion CLI, Bun runtime, `project.json` as sole Nx task source |
| **Git Discipline** | ✅ Feature branch; conventional commits; `pnpm biome check --write` before each commit |

**Post-design re-check** (after Phase 1):
- The `artifact-arch-check features` command scans the whole workspace, not a specific CALM file. This is fine — it's a workspace-level quality gate, analogous to `qa:dead-code`. No CALM model is required for a linting tool.
- `list-features` step definitions moving into the package means the package takes on `playwright` as a dependency. `playwright` is a dev-only dependency (not published). This is acceptable for a `features` package.

## Project Structure

### Documentation (this feature)

```text
specs/002-generic-features-runner/
├── plan.md                       # This file
├── research.md                   # Phase 0 decisions
├── data-model.md                 # Phase 1 entities and state transitions
├── contracts/
│   ├── features-package-contract.md    # Package API and file layout
│   ├── runner-cli-contract.md          # CLI arguments and exit codes
│   └── features-workspace-check-contract.md  # arch-check features subcommand
├── quickstart.md                 # Validation guide
└── tasks.md                      # Phase 2 output (not yet created)
```

### Source Code (repository root)

```text
# NEW package
cli/artifact-features-runner-playwright/
├── package.json              # name: @alistigo/artifact-features-runner-playwright, private, type: infrastructure
├── project.json              # Nx tasks: build, typecheck, lint, clean, test:list
├── tsconfig.json
└── src/
    ├── cli.ts                # Clipanion entry point — registers RunCommand
    └── commands/
        └── run.ts            # RunCommand: --target (required), --host (optional)

# MODIFIED package (step defs move in; metadata added)
packages/list-features/
├── package.json              # +alistigo: { type: "features", domain: "list" }; +playwright devDep
├── src/
│   ├── index.ts              # +STEP_DEFINITIONS_DIR export
│   └── step-definitions/     # MOVED from cli/list-features-runner-playwright/src/step_definitions/
│       ├── actions.steps.ts
│       ├── assertions.steps.ts
│       └── setup.steps.ts

# MODIFIED CLI (new FeaturesCommand added)
cli/artifact-arch-check/
└── src/
    ├── cli.ts                # +register FeaturesCommand
    ├── checks/
    │   └── features-workspace-scan.ts   # NEW: validates features packages workspace-wide
    └── cli/
        └── commands/
            └── features.ts   # NEW: FeaturesCommand (Clipanion)

# MODIFIED schema (add "features" to enum)
packages/architecture/extensions/
└── alistigo-package-metadata.schema.json   # +"features" in type enum

# DELETED
cli/list-features-runner-playwright/        # Entire directory removed after migration
```

**Structure Decision**: The generic runner lives in `cli/` (not `packages/`) because it is private and not published to npm. All Nx task definitions live exclusively in `project.json` files per constitution.

## Complexity Tracking

No constitution violations. The addition of `playwright` as a devDependency to `list-features` is intentional — the step definitions own their own browser automation dependency rather than inheriting it from a runner that may not exist.
