# Tasks: Generic Artifact Features Runner

**Input**: Design documents from `specs/002-generic-features-runner/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tasks grouped by user story — each story is an independently testable increment.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no sequential dependency)
- **[Story]**: User story label (US1, US2, US3)
- Exact file paths in every description

---

## Phase 1: Setup

**Purpose**: Create the feature branch before any code changes.

- [x] T001 Create git branch `feat/002-generic-features-runner` from `main` and switch to it

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that blocks all three user stories.

**⚠️ CRITICAL**: Complete this phase before any user story work begins.

- [x] T002 Add `"features"` to the `type` enum in `packages/architecture/extensions/alistigo-package-metadata.schema.json` so the existing `alistigo-metadata` arch-check accepts `"alistigo": { "type": "features" }` on any package
- [x] T003 [P] Scaffold `cli/artifact-features-runner-playwright/package.json` with `"name": "@alistigo/artifact-features-runner-playwright"`, `"private": true`, `"type": "module"`, `"alistigo": { "type": "infrastructure" }`, and devDependencies: `@cucumber/cucumber` (same major as `cli/list-features-runner-playwright`), `playwright` (same version), `clipanion`, `ink`, `react`, `@cucumber/pretty-formatter`, `tsx`, `@types/node`
- [x] T004 [P] Create `cli/artifact-features-runner-playwright/tsconfig.json` extending `../../tsconfig.base.json` with `"outDir": "dist"` and `"rootDir": "src"`
- [x] T005 Create `cli/artifact-features-runner-playwright/project.json` with Nx targets: `build` (command: `tsc -p tsconfig.json`), `typecheck`, `lint` (biome), `clean` (rm -rf dist); run `pnpm install` to register the new package in the workspace

**Checkpoint**: New runner package is in the workspace and installable. Foundation is ready.

---

## Phase 3: User Story 1 — Generic Runner CLI (Priority: P1) 🎯 MVP

**Goal**: A working CLI that accepts `--target` and `--host`, loads a features package dynamically, and runs all its Gherkin scenarios against the given host.

**Independent Test**: `pnpm nx run artifact-features-runner-playwright:test:list` runs all list-features scenarios against a local playground and exits 0 (requires Phase 4 to also be complete for full end-to-end).

### Implementation

- [x] T006 [US1] Create `cli/artifact-features-runner-playwright/src/cli.ts` — Clipanion entry point: create a `Cli` instance with `binaryLabel: "artifact-features-runner-playwright"`, `binaryName: "artifact-features-runner-playwright"`; read version via `createRequire(import.meta.url)("../package.json").version`; register `RunCommand`, `Builtins.HelpCommand`, `Builtins.VersionCommand`; call `cli.runExit(process.argv.slice(2))`
- [x] T007 [US1] Create `cli/artifact-features-runner-playwright/src/commands/run.ts` — `RunCommand` with `static override paths = [Command.Default]`; `target = Option.String("--target", { required: true, description: "npm package name of the features package (e.g. @alistigo/list-features)" })`; `host = Option.String("--host", "http://localhost:4173", { description: "Base URL of the playground to test against" })`
- [x] T008 [US1] Implement package resolution in `RunCommand.execute()` in `cli/artifact-features-runner-playwright/src/commands/run.ts`: (1) validate `--host` is a valid http/https URL — if not, print error and return 1; (2) use `createRequire(import.meta.url)` to resolve `${this.target}/package.json` — catch resolution failure and print "Cannot resolve package '<target>'" then return 1; (3) read the resolved `package.json` and check `alistigo?.type === "features"` — if not, print "Package '<target>' is not a features package (alistigo.type is '<actual>', expected 'features')" then return 1
- [x] T009 [US1] Implement dynamic features loading in `RunCommand.execute()` in `cli/artifact-features-runner-playwright/src/commands/run.ts`: (4) `const pkg = await import(this.target)` — catch import errors and return 1; (5) validate `typeof pkg.FEATURES_DIR === "string"` and `typeof pkg.STEP_DEFINITIONS_DIR === "string"` — if either is missing, print "Package '<target>' does not export FEATURES_DIR or STEP_DEFINITIONS_DIR" then return 1; (6) also check `pkg.SUPPORT_DIR` for before/after hooks if exported; include it in the import glob if present
- [x] T010 [US1] Implement cucumber execution in `RunCommand.execute()` in `cli/artifact-features-runner-playwright/src/commands/run.ts`: set `process.env["PLAYWRIGHT_BASE_URL"] = this.host`; build `IRunOptions` with `paths: [\`${pkg.FEATURES_DIR}/**/*.feature\`]`, `import: [\`${pkg.STEP_DEFINITIONS_DIR}/**/*.js\`, ...(pkg.SUPPORT_DIR ? [\`${pkg.SUPPORT_DIR}/**/*.js\`] : [])]`, `format: ["@cucumber/pretty-formatter"]`, `failFast: true`, `tags: "not @todo"`; call `const { success } = await run({ provided: cucumberOptions })` from `@cucumber/cucumber/api`; return `success ? 0 : 1`
- [x] T011 [US1] Add error handling for zero feature files in `RunCommand.execute()` in `cli/artifact-features-runner-playwright/src/commands/run.ts`: after resolving `FEATURES_DIR`, use `glob` or `fs.readdirSync` to count `.feature` files — if zero, print "No .feature files found in '<FEATURES_DIR>'" and return 1
- [x] T012 [US1] Add `"bin": { "artifact-features-runner-playwright": "./dist/cli.js" }` to `cli/artifact-features-runner-playwright/package.json`; add `test:list` Nx target to `cli/artifact-features-runner-playwright/project.json`: `{ "command": "bun src/cli.ts --target=@alistigo/list-features", "dependsOn": ["build", { "projects": ["list-features"], "target": "build" }] }`

**Checkpoint**: Runner CLI code is complete. T012's `test:list` target will be runnable end-to-end once Phase 4 (list-features migration) is done.

---

## Phase 4: User Story 2 — Migrate list-features to Features Package Contract (Priority: P2)

**Goal**: `@alistigo/list-features` becomes a fully conformant `features` package — with metadata, step definitions, page objects, and support hooks all living inside the package, exported via `FEATURES_DIR`, `STEP_DEFINITIONS_DIR`, and `SUPPORT_DIR`.

**Independent Test**: `pnpm nx run artifact-features-runner-playwright:test:list` exits 0 against a running playground, with identical scenario pass/fail results to the pre-migration `cli/list-features-runner-playwright` baseline.

### Implementation

- [x] T013 [P] [US2] Add `"alistigo": { "type": "features", "domain": "list" }` to `packages/list-features/package.json`
- [x] T014 [P] [US2] Add `playwright` (match version from `cli/list-features-runner-playwright/package.json`) and `@cucumber/cucumber` (match version) to `packages/list-features/package.json` devDependencies; run `pnpm install` to update the lockfile
- [x] T015 [US2] Create `packages/list-features/src/step-definitions/` directory; move all three step definition files from `cli/list-features-runner-playwright/src/step_definitions/` (`actions.steps.ts`, `assertions.steps.ts`, `setup.steps.ts`) to `packages/list-features/src/step-definitions/`
- [x] T016 [US2] Create `packages/list-features/src/pages/` directory; move all files from `cli/list-features-runner-playwright/src/pages/` to `packages/list-features/src/pages/`
- [x] T017 [US2] Create `packages/list-features/src/support/` directory; move all files from `cli/list-features-runner-playwright/src/support/` (World class and cucumber before/after hooks) to `packages/list-features/src/support/`
- [x] T018 [US2] Update all import paths in the moved files (`packages/list-features/src/step-definitions/*.ts`, `src/pages/*.ts`, `src/support/*.ts`) — fix any relative imports that broke due to the directory change; ensure imports of `@alistigo/list-document`, `@alistigo/artifact-plugin-api`, and other workspace packages use their npm names (not relative paths that escape the package boundary)
- [x] T019 [US2] Add `STEP_DEFINITIONS_DIR` and `SUPPORT_DIR` exports to `packages/list-features/src/index.ts`: resolve both as absolute paths using `path.resolve(path.dirname(fileURLToPath(import.meta.url)), "step-definitions")` and `path.resolve(path.dirname(fileURLToPath(import.meta.url)), "support")` respectively — the same pattern as the existing `FEATURES_DIR` export; both point into `dist/` and remain valid after build
- [x] T020 [US2] Verify `packages/list-features` compiles: run `pnpm nx run list-features:build`; fix any TypeScript errors in the moved step definitions or page objects

**Checkpoint**: `pnpm nx run artifact-features-runner-playwright:test:list` is now fully runnable end-to-end. Verify it passes all scenarios that the old runner passed.

---

## Phase 5: User Story 3 — Arch-check Validates Features Packages (Priority: P3)

**Goal**: `artifact-arch-check features` subcommand scans the workspace and enforces naming convention + domain metadata on all `type: features` packages.

**Independent Test**: `pnpm nx run artifact-arch-check:qa:artifact-arch-check:features` exits 0 for the workspace (only `@alistigo/list-features` has `type: features` at this point; it passes all three validation rules).

### Implementation

- [ ] T021 [US3] Create `cli/artifact-arch-check/src/checks/features-workspace-scan.ts` — export an async function `scanFeaturesPackages(workspaceRoot: string): Promise<FeaturePackageCheckResult[]>` that: (1) recursively finds all `package.json` files under `workspaceRoot` (excluding `node_modules`); (2) filters to those with `alistigo?.type === "features"`; (3) for each, runs three checks: `features/naming-convention` (name without scope must end with `-features`), `features/domain-required` (`alistigo.domain` must be present and non-empty), `features/domain-consistent` (`alistigo.domain` must equal the name prefix before `-features` in the unscoped name); (4) returns `{ packageName, packagePath, issues: CheckIssue[] }[]`
- [ ] T022 [US3] Create `cli/artifact-arch-check/src/cli/commands/features.ts` — `FeaturesCommand extends Command` with `static override paths = [["features"]]`; `workspace = Option.String("--workspace", process.cwd(), { ... })`; `json = Option.Boolean("--json", false, { ... })`; in `execute()`: call `scanFeaturesPackages(this.workspace)`, render results (human-readable via Ink `CheckReport`-style component or JSON via `JSON.stringify`), return 0 if no issues else 1
- [ ] T023 [US3] Register `FeaturesCommand` in `cli/artifact-arch-check/src/cli.ts`: add `import { FeaturesCommand } from "./cli/commands/features.js"` and `cli.register(FeaturesCommand)`
- [ ] T024 [US3] Add `qa:artifact-arch-check:features` Nx target to `cli/artifact-arch-check/project.json`: `{ "command": "bun src/cli.ts features", "options": { "cwd": "{workspaceRoot}" } }`
- [ ] T025 [US3] Update the root `qa:artifact-arch-check` Nx target (wherever it is defined — check `project.json` for the `holos` root project) to include `artifact-arch-check:qa:artifact-arch-check:features` as a dependency or add it as a separate parallel `qa` step

**Checkpoint**: `pnpm nx run artifact-arch-check:qa:artifact-arch-check:features` exits 0 for the current workspace. Adding a package with broken metadata causes it to exit 1.

---

## Phase 6: Polish & Cleanup

**Purpose**: Delete the old runner, wire up QA, verify no regressions.

- [x] T026 Delete the entire `cli/list-features-runner-playwright/` directory; run `pnpm install` to remove it from the pnpm workspace and clean up lockfile references
- [x] T027 [P] Check `pnpm-workspace.yaml` and root `package.json`/`project.json` for any references to `list-features-runner-playwright` and remove them
- [x] T028 Run `pnpm biome check --write .` across all changed packages; stage any auto-fixed files in the same commit
- [x] T029 Run `pnpm nx run holos:qa`; fix all issues found by lint, arch-check, dead-code (Fallow), and type-check
- [ ] T030 Run the quickstart.md Scenario 1 against a live playground to confirm end-to-end pass; confirm scenario count matches or exceeds pre-migration baseline

---

## Phase 7: Convergence

- [x] T031 Add `README.md` and `LICENSE` to `cli/artifact-features-runner-playwright/` — every workspace package MUST have both per Constitution §I; use the same MIT `LICENSE` text as other `cli/*` packages; README should document the CLI usage (`--target`, `--host`) and how to add a new features package per FR-001–FR-003 (missing, Constitution §I)
- [x] T032 Wire `qa:artifact-arch-check:features` into the root QA gate: in `cli/artifact-arch-check/project.json` add `qa:artifact-arch-check:features` as a dependency of `qa:artifact-arch-check` via `dependsOn`, or add a separate `qa:artifact-arch-check:features` entry to the root `project.json`'s `qa` target so that `pnpm nx run holos:qa` runs the features validation on every PR per SC-003 and unchecked T025 (missing, T025 / SC-003)
- [x] T033 Amend `.specify/memory/constitution.md` §Engineering Standards §Package Metadata to add `"features"` to the valid types list (alongside `domain, application, presentation, infrastructure, plugin, skill, widget`); follow amendment procedure: increment patch version (1.2.0 → 1.2.1), update `Last Amended` to today, commit as `docs: amend constitution to v1.2.1 (add features package type)` per plan §Constitution Check (partial, Engineering Standards §Package Metadata)
- [x] T034 Add a `features/domain-unique` check to `cli/artifact-arch-check/src/checks/features-workspace-scan.ts`: after collecting all results, detect duplicate `alistigo.domain` values across packages and push a `{ rule: "features/domain-unique", severity: "error", message: ... }` issue to each affected package; wire the warning into `FeaturesCommand.execute()` output per spec Edge Cases and Key Entities ("domains MUST be unique across the workspace") (missing, spec Edge Cases)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1; **blocks all user stories**
- **Phase 3 (US1)**: Depends on Phase 2; can start immediately after — runner code doesn't require list-features to be migrated yet
- **Phase 4 (US2)**: Depends on Phase 2; can start in parallel with Phase 3 — independent files
- **Phase 5 (US3)**: Depends on Phase 2; can start in parallel with Phases 3 and 4
- **Phase 6 (Polish)**: Depends on all three user story phases being complete

### User Story Dependencies

- **US1 (Phase 3)**: No dependency on US2 or US3 for code authoring; `test:list` is not runnable until US2 is done
- **US2 (Phase 4)**: No dependency on US1 or US3 for code authoring; validates via US1's runner
- **US3 (Phase 5)**: No dependency on US1 or US2 for code authoring; runs independently

### Within Each Story

- Phase 3: T006 → T007 → T008 → T009 → T010 → T011 → T012 (sequential command development)
- Phase 4: T013 and T014 are parallel; T015 → T016 → T017 → T018 (sequential file moves); T019 and T020 follow T018
- Phase 5: T021 → T022 → T023 → T024 → T025 (sequential build-up)

---

## Parallel Execution Examples

### Phases 3 + 4 + 5 can all start after Phase 2

```
After T005 completes:
  → Start Phase 3 (T006...) — build the generic runner
  → Start Phase 4 (T013...) — migrate list-features
  → Start Phase 5 (T021...) — extend arch-check
```

### Within Phase 2 (after T002)

```
T003: scaffold runner package.json
T004: create runner tsconfig.json   ← parallel with T003
```

### Within Phase 4

```
T013: add alistigo metadata to list-features/package.json
T014: add playwright devDep          ← parallel with T013
```

---

## Implementation Strategy

### MVP Scope (US1 + US2 only)

1. Phase 1: Create branch
2. Phase 2: Foundational setup
3. Phase 3 (US1): Build generic runner
4. Phase 4 (US2): Migrate list-features
5. Run `test:list` to verify — this is the deliverable
6. Phase 6: Cleanup (delete old runner, biome, QA)
7. Skip Phase 5 (US3) if arch-check extension is not urgent

### Full Scope

1. All 6 phases in order, using parallel opportunities

### Notes

- `[P]` tasks touch different files and have no cross-dependencies — run in parallel
- Build list-features before running any `test:list` target
- The old runner (`list-features-runner-playwright`) is not deleted until Phase 6 — it can be used as a regression baseline during Phase 4 migration
- Commit after each phase boundary (T005, T012, T020, T025, T030) at minimum
- Run `pnpm biome check --write .` before every commit (not just T028)
