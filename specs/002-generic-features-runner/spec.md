# Feature Specification: Generic Artifact Features Runner

**Feature Branch**: `feat/002-generic-features-runner`

**Created**: 2026-11-16

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Gherkin features against any artifact (Priority: P1)

A developer working on an artifact (e.g., the list artifact) wants to verify that all specified behaviors pass against a running playground. They invoke the runner CLI with the name of a features package and optionally a host URL. The runner loads the features and step definitions from the package, executes all scenarios against the specified host, and reports which scenarios pass or fail.

**Why this priority**: This is the core value: a single, reusable tool that can validate any artifact's behaviors without coupling the runner to any specific artifact domain.

**Independent Test**: Run the CLI with `--target=@alistigo/list-features` against a local playground and verify it executes all list-features scenarios and reports pass/fail results.

**Acceptance Scenarios**:

1. **Given** a playground is running at a known host, **When** the CLI is invoked with `--target=@alistigo/list-features`, **Then** all Gherkin scenarios from the list-features package are executed against that host and results are displayed.
2. **Given** a custom host URL is provided via `--host`, **When** the CLI runs, **Then** all browser interactions target the given URL.
3. **Given** no `--host` argument is provided, **When** the CLI runs, **Then** it defaults to the local playground address.
4. **Given** one or more scenarios fail, **When** the run completes, **Then** the CLI exits with a non-zero code and lists failing scenarios with their step failure details.

---

### User Story 2 - Create a conformant features package (Priority: P2)

A developer creating a new artifact wants to introduce a companion features package that bundles the Gherkin `.feature` files and step definitions for that artifact. They follow the `features` package type convention: naming the package `${domain}-features`, declaring `"alistigo": { "type": "features", "domain": "<domain>" }` in `package.json`, and exporting the feature files and step definitions through the package's public API.

**Why this priority**: Without a stable and validated contract for what a features package must look like, the generic runner cannot reliably discover and load scenarios from arbitrary packages.

**Independent Test**: Create a minimal features package (e.g., `dummy-features`) with valid metadata and a single `.feature` file. Confirm the arch-check tool accepts it and the runner CLI can target it and run its scenario.

**Acceptance Scenarios**:

1. **Given** a package named `${domain}-features` with `"alistigo": { "type": "features", "domain": "${domain}" }`, **When** the arch-check tool runs, **Then** it reports no violations for that package.
2. **Given** a features package with the wrong name pattern (e.g., `${domain}-specs`), **When** arch-check runs, **Then** it reports a naming convention violation.
3. **Given** a features package missing the `domain` field in its metadata, **When** arch-check runs, **Then** it reports a missing required metadata field.
4. **Given** a valid features package, **When** the runner CLI targets it, **Then** the runner successfully loads and executes its scenarios.

---

### User Story 3 - Arch-check validates features packages (Priority: P3)

The architecture linting tool (`artifact-arch-check`) is updated to recognize and validate the new `features` package type. When it encounters a package declaring `"type": "features"`, it checks that the package name follows the `${domain}-features` convention, the required `domain` metadata field is present, and the naming is internally consistent (the name prefix matches the declared domain).

**Why this priority**: Governance — prevents features packages from drifting out of the agreed convention before they even enter the codebase, the same way arch-check already enforces rules for other package types.

**Independent Test**: Run `pnpm qa:artifact-arch-check` on the workspace and confirm it validates all features packages (including the refactored `list-features`) without errors, and that it catches a deliberately malformed features package.

**Acceptance Scenarios**:

1. **Given** arch-check processes the workspace, **When** it encounters a features package, **Then** it validates: name follows `${domain}-features`, `domain` field is present and consistent with the package name, and `type` is `features`.
2. **Given** a features package where the declared `domain` does not match the name prefix (e.g., name `list-features` with `"domain": "kanban"`), **When** arch-check runs, **Then** it reports a metadata inconsistency error.
3. **Given** all existing features packages pass arch-check, **When** a new features package is added that is fully conformant, **Then** arch-check continues to pass with no regressions.

---

### Edge Cases

- What happens when the target package declared as `--target` is not installed or cannot be resolved? The CLI must fail immediately with a clear error message naming the missing package.
- What happens when a features package exports step definitions that reference browser-automation hooks but the host is unreachable? The CLI must report a connection error before attempting to run scenarios.
- What happens when the features package's metadata is valid but it exports zero `.feature` files? The CLI should warn and exit cleanly (no test failures, but a non-zero exit if the user expects tests).
- What happens when two features packages declare the same `domain`? Arch-check should report a duplication warning (assumption: domains must be unique across the workspace).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The runner CLI MUST accept a required `--target` argument that identifies the features package to execute (by npm package name, e.g., `@alistigo/list-features`).
- **FR-002**: The runner CLI MUST accept an optional `--host` argument that specifies the base URL of the running playground; when omitted, the CLI defaults to the local playground's default address.
- **FR-003**: The runner CLI MUST discover and execute all Gherkin `.feature` files and their corresponding step definitions exported by the target features package.
- **FR-004**: The runner CLI MUST report scenario results (pass/fail/skipped) in a human-readable format and exit with a non-zero code when any scenario fails.
- **FR-005**: The runner CLI MUST be renamed from `list-features-runner-playwright` to `artifact-features-runner-playwright`, and the existing list-features integration MUST be migrated to use the new runner without behavioral regression.
- **FR-006**: A `features` package type MUST be formally defined for `@alistigo` workspace packages: a package of this type exports Gherkin `.feature` files AND TypeScript step definitions; it MAY additionally export setup hooks or plugins consumed by the runner.
- **FR-007**: Every `features` package MUST declare `"alistigo": { "type": "features", "domain": "<domain-name>" }` in its `package.json`, where `domain-name` matches the domain it targets (e.g., `"list"` for `@alistigo/list-features`).
- **FR-008**: Every `features` package MUST follow the naming convention `${domain}-features` (npm name `@alistigo/${domain}-features`), and the `domain` metadata value MUST be identical to the `${domain}` prefix in the package name.
- **FR-009**: The `artifact-arch-check` CLI MUST be extended to recognize `type: features` packages and validate: naming convention, presence and consistency of the `domain` metadata field.
- **FR-010**: The `list-features` package MUST be updated to declare `"alistigo": { "type": "features", "domain": "list" }` in its metadata, making it fully conformant with the new convention.

### Key Entities

- **Features Package**: A workspace package of type `features` that bundles Gherkin `.feature` files and TypeScript step definitions for one artifact domain. Identified by its npm name (`@alistigo/${domain}-features`) and `domain` metadata field.
- **Runner CLI** (`artifact-features-runner-playwright`): A command-line tool that accepts a target features package and a host URL, loads the package's scenarios and step definitions at runtime, and executes them via a browser-automation driver against the specified host.
- **Domain**: A string identifier that ties a features package to a specific artifact (e.g., `"list"` for the list artifact). Must be unique across the workspace and consistent between the package name and its metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can run all list-features scenarios against a local playground with a single command in under 60 seconds (excluding playground startup time), producing no regressions compared to the pre-refactor runner.
- **SC-002**: Adding a new features package for any future artifact requires only: creating the package with the correct name and metadata, and invoking the runner CLI with `--target=@alistigo/<domain>-features` — zero changes to the runner CLI itself.
- **SC-003**: `pnpm qa:artifact-arch-check` catches 100% of features packages that violate the naming convention or metadata contract, with an actionable error message for each violation.
- **SC-004**: The refactored `list-features` package passes arch-check with no violations and the runner produces identical test results to the previous `list-features-runner-playwright` behavior.

## Assumptions

- The playground is already running when the runner CLI is invoked; the CLI does not start or stop the playground.
- The existing `list-features` package already exports step definitions in a form that the runner can consume; refactoring the package will adapt those exports to the new contract without rewriting step definitions.
- The runner loads features packages dynamically from the local workspace (not from a published npm registry); this means the target package must be locally installed.
- Domain names are assumed to be unique across the workspace; two features packages MAY NOT declare the same `domain` value.
- The `artifact-ai-draw-comments-features` package is in-scope for the arch-check validation updates but is NOT being refactored in this iteration — only `list-features` is actively migrated.
- The playground's default local address (used when `--host` is omitted) is defined within the runner's configuration and does not need to be specified by the user during local development.
