# Research: Generic Artifact Features Runner

## Decision 1: Where step definitions live

**Decision**: Step definitions move FROM the runner CLI INTO the features package.

**Rationale**: The whole point of the generic runner is that it doesn't know about any specific domain. If step definitions live in the runner, the runner must be updated every time a new domain is added — defeating the purpose. `artifact-ai-draw-comments-features` already proves this pattern: it carries its own `step-definitions/` folder. The features package is self-contained and the runner just wires it up.

**Alternatives considered**:
- Keeping step definitions in the runner (current state): ruled out — runner would stay domain-specific.
- A shared "step definition adapter" package: overcomplicated, no value for V1.

---

## Decision 2: How the runner discovers features and step defs from the target package

**Decision**: The features package exports two path constants from its main index — `FEATURES_DIR` (already exists in `list-features`) and `STEP_DEFINITIONS_DIR` (new). The runner imports these dynamically via `import()` after resolving the package root.

**Rationale**: The runner can do `const pkg = await import(target)` (where `target` is the npm package name). The package is already installed in the workspace `node_modules`. The exported path constants give the runner everything it needs to build the cucumber config dynamically. This is simpler and more explicit than scanning the package filesystem for globs.

**Alternatives considered**:
- Reading a `cucumber.json` manifest embedded in the features package: adds a file format; the TS exports are simpler and already typed.
- Filesystem glob scanning from the resolved package root: brittle, depends on internal layout assumptions not enforced by the package contract.

---

## Decision 3: How the host URL is passed to step definitions

**Decision**: The runner CLI sets the `PLAYWRIGHT_BASE_URL` environment variable before forking the cucumber process. Playwright natively reads `PLAYWRIGHT_BASE_URL` and uses it as the base for relative navigations. No changes to step definition code are needed.

**Rationale**: `PLAYWRIGHT_BASE_URL` is Playwright's own convention — it is documented and already understood by any Playwright project. Using an env var avoids the need for a custom world parameter protocol, and step definitions can use `page.goto('/')` without caring where the base URL comes from.

**Alternatives considered**:
- Cucumber `--world-parameters '{"host": "..."}'`: requires step definitions to read from world params rather than Playwright's native mechanism — coupling the step defs to the runner protocol.
- A custom env var (e.g., `ALISTIGO_HOST`): redundant when Playwright already has the standard.

---

## Decision 4: How arch-check validates features packages (new command vs new check)

**Decision**: Add a new subcommand `artifact-arch-check features` that scans the entire workspace for packages with `"alistigo": { "type": "features" }` and validates each one. It does NOT require a CALM file argument.

**Rationale**: The existing `artifact-arch-check check <artifact>` flow is CALM-driven — it validates packages that are declared in an artifact's architecture model. Features packages are cross-artifact and workspace-global, so they need their own scan mode. A new subcommand is clean, composable, and follows the Clipanion pattern already in place. The `qa:artifact-arch-check` Nx target can run both commands.

**Alternatives considered**:
- Adding `features-conformance` as one more check in the existing `check` flow: requires calling `artifact-arch-check check list --only features-conformance` per artifact — doesn't generalize to workspace-wide scanning.
- A completely separate CLI tool: overkill; `artifact-arch-check` is already the home for package metadata validation.

---

## Decision 5: How `"features"` is added to the metadata schema

**Decision**: Add `"features"` to the `type` enum in `packages/architecture/extensions/alistigo-package-metadata.schema.json`. The existing `alistigo-metadata` check already reads valid types from this schema file — no code change needed to the check itself, only the schema data.

**Rationale**: The schema is the single source of truth for valid `alistigo.type` values. Adding `"features"` there unlocks it for all packages without touching the check logic.

---

## Decision 6: Runner CLI location and package metadata

**Decision**: The new runner lives at `cli/artifact-features-runner-playwright/` with `"private": true` and `"alistigo": { "type": "infrastructure" }`. The old `cli/list-features-runner-playwright/` is deleted after the migration succeeds.

**Rationale**: The runner is an internal dev tool, not a published package. Placing it in `cli/` matches the existing pattern. `type: infrastructure` is the correct classification — it's a tool that orchestrates other packages rather than owning domain logic. Deleting the old runner avoids a dead-code flag from Fallow.

---

## Decision 7: Cucumber invocation strategy in the generic runner

**Decision**: The runner invokes cucumber via its programmatic JavaScript API (`@cucumber/cucumber`'s `IRunOptions`) rather than spawning a child process. The dynamically resolved `FEATURES_DIR` and `STEP_DEFINITIONS_DIR` are passed into the config at runtime.

**Rationale**: The programmatic API gives full control over the cucumber options (paths, imports, world parameters, formatters) without the shell-escaping and env-serialization complexity of spawning a subprocess. It also makes the runner a proper Node module that can be tested without process isolation.

**Alternatives considered**:
- Spawning `npx cucumber-js` as a child process with `--require` flags: works but requires shell construction and makes the runner harder to unit-test.
