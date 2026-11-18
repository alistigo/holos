# Feature Specification: Draw-Comments End-to-End Features via the Generic Runner

**Feature Branch**: `feat/003-draw-comments-e2e-harness`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "In a previous feature we set `artifact-features-runner-playwright` CLI as a generic runner to run features for an artifact. Now we need to convert `@alistigo/artifact-ai-draw-comments-features` to follow the same system as `@alistigo/list-features`. So for that first we need to be able to use the artifact `@alistigo/artifact-ai-draw-comments` in the playground. Then the runner CLI should be able to run the artifact on the playground and execute the feature files. When doing this refactoring there will be probably some kind of code duplicate between the two `features` package. That code duplicate should then live directly inside the runner, I'm thinking about hooks / world setup etc ... What should remain in feature package is the features and step definition that are specific to the domain."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select and run the draw-comments widget in the playground (Priority: P1)

A developer opens the dev playground, picks `@alistigo/artifact-ai-draw-comments` from the Artifact selector, and the widget mounts inside the preview iframe exactly as the list artifact does. Because the playground already simulates the Claude bridge, the developer can draw an annotation and see a simulated Claude response without any real Claude environment.

**Why this priority**: Nothing else in this feature can be built or verified until the widget is reachable in the playground — it is the host the runner drives. It also delivers standalone value: manual exploratory testing of the widget becomes possible for the first time.

**Independent Test**: Start the playground, choose the draw-comments artifact in the selector, and confirm the "Draw Comment" control is visible inside the preview iframe and a full annotate→send→respond cycle completes against the playground's Claude simulator.

**Acceptance Scenarios**:

1. **Given** the playground is running, **When** the developer opens the Artifact selector, **Then** `@alistigo/artifact-ai-draw-comments` is offered alongside the already-registered artifacts.
2. **Given** the draw-comments artifact is selected, **When** the preview iframe reloads, **Then** the iframe's injected configuration reports that artifact and the widget's UI renders inside the iframe.
3. **Given** the draw-comments widget is mounted in the playground with the Claude context active, **When** an annotation is sent, **Then** the playground's Claude simulator receives the request and its canned response is displayed by the widget.
4. **Given** the draw-comments artifact is selected, **When** the developer switches back to another artifact, **Then** that artifact mounts correctly with no leftover state from the widget.

---

### User Story 2 - Run draw-comments scenarios through the generic runner (Priority: P1)

A developer runs a single Nx target for the draw-comments artifact. It boots the playground, waits for it, invokes the generic runner CLI with `--target=@alistigo/artifact-ai-draw-comments-features`, executes every browser-driven Gherkin scenario against the playground, tears the playground down, and exits non-zero if any scenario failed — identical in shape to the list artifact's existing end-to-end target.

**Why this priority**: This is the headline outcome: the draw-comments behaviour specifications stop being in-process domain assertions and become real conformance checks against the running widget, using the same tooling as every other artifact.

**Independent Test**: Run the draw-comments end-to-end target on a clean checkout and confirm all its scenarios execute in a browser against the playground and report pass/fail; deliberately break a widget control and confirm the run fails with a readable step failure.

**Acceptance Scenarios**:

1. **Given** a clean checkout, **When** the draw-comments end-to-end target runs, **Then** it builds its prerequisites, starts the playground, runs all non-skipped scenarios in a browser, and exits 0 when they pass.
2. **Given** a playground already running, **When** the attach variant of the target runs, **Then** scenarios execute against that instance without starting a second one.
3. **Given** a playground already running, **When** the doctor variant of the target runs, **Then** every chain check reports OK, including that the draw-comments artifact can be selected, reaches the preview iframe, and mounts.
4. **Given** one scenario's expectation no longer holds, **When** the target runs, **Then** the run exits non-zero and names the failing scenario and step, with a screenshot attached.
5. **Given** the runner is invoked with the draw-comments features package, **When** it loads that package, **Then** no change to the runner's target-resolution contract is needed — the package satisfies the existing features-package contract.

---

### User Story 3 - Shared browser harness lives in the runner, not in features packages (Priority: P1)

A developer adding a third features package writes only `.feature` files and domain-specific step definitions. Everything generic — browser launch and teardown, per-scenario context and page setup, skip handling for pending scenarios, screenshot-on-failure, the playground page object (artifact selection, preview-iframe access, readiness waiting, reload), and the plugin/storage request interception used to keep runs offline — is provided by the runner itself. Neither features package carries a copy.

**Why this priority**: Without this, converting draw-comments duplicates roughly the whole `src/support/` tree of `list-features`, and every later artifact duplicates it again. The user called this out explicitly as part of the deliverable.

**Independent Test**: Diff the two features packages after the change and confirm neither contains browser lifecycle hooks, a World constructor, or playground navigation code; then run the list artifact's existing end-to-end target and confirm all its scenarios still pass unchanged.

**Acceptance Scenarios**:

1. **Given** the harness has moved into the runner, **When** the list artifact's end-to-end target runs, **Then** every scenario that passed before still passes — no behavioural regression.
2. **Given** both features packages, **When** their sources are inspected, **Then** each contains only `.feature` files, domain step definitions, domain-specific selectors/fixtures, and its package metadata and exports.
3. **Given** a features package that provides no support directory of its own, **When** the runner executes it, **Then** the shared World and hooks are still registered and scenarios run.
4. **Given** a domain step definition, **When** it needs the browser page or the playground page object, **Then** it obtains them from the shared World without importing any browser-lifecycle code.
5. **Given** the shared harness is the single source of browser setup, **When** a scenario fails, **Then** a screenshot is attached to the report for both features packages identically.
6. **Given** the harness is published as its own entry point of the runner package, **When** a features package imports the shared World, **Then** it does so through that entry point and remains publishable itself.

---

### User Story 4 - The draw-comments features package conforms to the features-package contract (Priority: P2)

The draw-comments features package is converted from a self-contained in-process Cucumber project into a conformant `features` package: it declares the `features` package type with its domain, exports the directories the runner reads, drops its own Cucumber profile and standalone `test` target, and passes architecture linting.

**Why this priority**: Conformance is what makes the runner able to load the package at all, but it is mechanical once the harness and playground work exist, so it follows them.

**Independent Test**: Run the architecture-linting features scan over the workspace and confirm the draw-comments features package is reported as a conformant features package with no violations; confirm the runner can resolve and load it.

**Acceptance Scenarios**:

1. **Given** the converted package, **When** the architecture-linting features scan runs, **Then** it reports the package as a features package with no naming, domain-presence, domain-consistency, or domain-uniqueness violations.
2. **Given** the converted package, **When** the runner resolves it by npm name, **Then** it finds the feature files and the compiled step definitions through the package's exported directories.
3. **Given** the converted package, **When** its build target runs, **Then** compiled step definitions and the uncompiled `.feature` files are both available where the runner expects them.
4. **Given** the conversion is complete, **When** the workspace is inspected, **Then** the package no longer carries its own Cucumber profile or an in-process `test` target that bypasses the runner.

---

### Edge Cases

- **Widget readiness is unobservable**: the draw-comments widget is a `widget`-type package exempt from the Artifact Contract, so it does not currently expose the readiness marker the shared page object waits for — without one the harness hangs on every scenario. Resolved by having the widget expose the same root marker every artifact exposes (FR-006, FR-007); the marker becomes the one readiness contract the harness knows about.
- **Scenarios that no browser can observe**: several existing scenarios assert internals (that a generated PNG combines the capture and the shapes; that underlying content stays visible *through* a transparent canvas). Each is rewritten to assert the outcome a user can see instead — the sent annotation's image appearing in the conversation, and the host content behind the overlay staying visible (FR-026). No scenario is dropped.
- **Canvas interaction**: shapes are drawn on a canvas, not in the DOM, so a drawn rectangle has no accessible node to assert on. Drawing steps must therefore assert an outcome the widget surfaces itself — that the send control becomes available, that a shape count or undo affordance changes — rather than inspecting canvas pixels.
- **Claude simulator latency and error mode**: the playground's Claude simulator has a configurable delay and an error mode. Scenarios that send an annotation must be robust to the configured delay and must not depend on the default canned response text.
- **A scenario tagged as requiring a non-browser environment**: the existing suite has one scenario tagged for a document environment the runner does not provide. It is retagged as not-yet-implemented so the runner's existing skip handling reports it as skipped rather than failed (FR-027).
- **Switching artifacts mid-session**: selecting the widget and then another artifact must not leave the widget's global mount hook installed in a way that breaks the next artifact.
- **Running with no playground**: invoking the draw-comments target against an unreachable host must fail with the runner's existing host-unreachable diagnosis, not a scenario timeout.
- **Publishing the runner**: the runner becomes a published package so features packages can import its harness. Its command-line entry point and its harness entry point must stay separable, so importing the harness never drags command-line argument parsing into a test run.

## Requirements *(mandatory)*

### Functional Requirements

#### Playground integration

- **FR-001**: The playground MUST offer `@alistigo/artifact-ai-draw-comments` as a selectable artifact in its Artifact selector.
- **FR-002**: Selecting the draw-comments artifact MUST cause the playground's preview iframe to load and mount that artifact's bundle, with the selection reflected in the configuration the iframe exposes.
- **FR-003**: The draw-comments artifact MUST mount in the playground preview in both the Claude and the non-Claude AI-context modes, degrading gracefully (no uncaught page error) when the Claude bridge is absent.
- **FR-004**: When the Claude context is active, an annotation sent from the widget MUST reach the playground's Claude completion simulator, and the simulator's response MUST be rendered by the widget.
- **FR-005**: The playground MUST continue to offer and correctly mount all previously registered artifacts after the draw-comments artifact is added.
- **FR-006**: The draw-comments widget MUST expose, on the root it mounts, the same readiness marker the list artifact already exposes, so the shared harness can tell "mounted and interactive" from "still loading" without any domain-specific knowledge.
- **FR-007**: That readiness marker MUST be documented as the one signal every artifact and widget rendered in the playground exposes — it applies to `widget`-type packages even though they are otherwise exempt from the Artifact Contract, because the shared harness has no other way to wait.

#### Runner-owned shared harness

- **FR-008**: The runner MUST own and register the browser lifecycle: launching the browser once per run, honouring the existing headed/headless and chromium-executable resolution, and closing it at the end of the run.
- **FR-009**: The runner MUST own and register the per-scenario lifecycle: creating an isolated browser context and page, collecting uncaught page errors, opening the playground, and disposing of page and context afterwards.
- **FR-010**: The runner MUST own the shared World exposed to step definitions, providing at minimum: the playground base URL, the browser, context and page, the playground page object, collected page errors, artifact reload, and document/state seeding.
- **FR-011**: The runner MUST own a shared playground page object covering operations that are identical for every artifact: navigating to the playground, selecting an artifact, reaching the preview iframe, waiting for readiness, reloading, and enabling a plugin.
- **FR-012**: The runner MUST own the request-interception support that keeps runs offline and deterministic (serving local plugin bundles in place of CDN fetches, and stubbing unavailable storage backends).
- **FR-013**: The runner MUST own skip handling for scenarios tagged as not-yet-implemented and screenshot attachment on step failure, applied uniformly to every features package.
- **FR-014**: The runner MUST register the shared harness for every target features package, including one that exports no support directory of its own.
- **FR-015**: A features package MUST be able to extend the shared World with domain-specific state and helpers without re-declaring the browser lifecycle.
- **FR-016**: The runner package MUST become publishable and MUST expose the shared harness through a dedicated entry point, distinct from its command-line entry point, so the harness can be imported as a library while the CLI stays a CLI.
- **FR-017**: A features package MUST obtain the shared World and playground page object — and their types — from the runner's harness entry point, and that dependency MUST NOT prevent the features package from being published.
- **FR-018**: The harness entry point MUST be treated as a versioned public API: its exported surface is documented, and a breaking change to it is a breaking change of the runner package.
- **FR-019**: After the move, neither features package MAY contain browser lifecycle hooks, a World constructor, or playground navigation code.

#### Draw-comments features package conversion

- **FR-020**: The draw-comments features package MUST declare the `features` package type together with a `domain` value consistent with its package name, and MUST pass the architecture-linting features scan with no violations.
- **FR-021**: The draw-comments features package MUST export the directory holding its `.feature` files and the directory holding its compiled step definitions, and MAY export a support directory for domain-specific support code.
- **FR-022**: The draw-comments features package's build MUST produce compiled step definitions and make the `.feature` files available at the exported locations.
- **FR-023**: The draw-comments features package MUST drop its own Cucumber profile and its in-process `test` target, so the runner is the only way its scenarios execute.
- **FR-024**: The draw-comments features package MUST retain only domain-specific content: `.feature` files, step definitions, domain selectors, domain fixtures, and its documentation and metadata.
- **FR-025**: Every scenario in the draw-comments suite MUST be retained and MUST be driven through the widget's user interface in the playground; none may assert against the domain layer in process.
- **FR-026**: Scenarios whose current assertions name internals MUST be rewritten so each outcome is observable in the rendered widget — the generated-PNG scenario asserts that the sent annotation's image is displayed in the conversation, and the transparency scenario asserts that the host content behind the overlay stays visible to the user.
- **FR-027**: The scenario that requires a non-browser document environment MUST be retagged as not-yet-implemented so the runner skips it visibly, rather than failing or disappearing from the report.
- **FR-028**: Scenario steps MUST locate widget controls by their accessible roles and names, falling back to explicit test identifiers only where no accessible name can disambiguate.
- **FR-029**: Scenarios that exercise the Claude round trip MUST be robust to the playground simulator's configured response delay and MUST NOT assert on its default canned response text.

#### Developer workflow

- **FR-030**: The draw-comments artifact MUST provide an end-to-end target that builds its prerequisites, starts the playground, waits for it to answer, runs the scenarios, tears the playground down, and propagates the run's exit status.
- **FR-031**: The draw-comments artifact MUST provide an attach variant that runs against an already-running playground, and a doctor variant that diagnoses the whole chain for its features package.
- **FR-032**: All of these targets MUST be defined in the project's Nx task definition, not duplicated as package scripts.
- **FR-033**: The list artifact's existing end-to-end, attach, and doctor targets MUST keep working with no change in observable behaviour.
- **FR-034**: The runner's documentation MUST describe the harness entry point it now publishes, what a features package is still expected to provide, and how a new features package plugs in.

### Key Entities

- **Draw-comments widget** (`@alistigo/artifact-ai-draw-comments`): the embeddable annotation widget under test. Declares the `widget` package type; mounts itself into a host page and talks to Claude through the artifact bridge.
- **Draw-comments features package** (`@alistigo/artifact-ai-draw-comments-features`): after conversion, a `features`-type package holding only the draw-comments `.feature` files and their domain step definitions.
- **Shared harness**: the runner-owned collection of browser lifecycle hooks, shared World, playground page object, and request interception that every features package relies on and none of them contains. Published as a dedicated entry point of the runner package, separate from its command-line entry point.
- **Readiness marker**: the single signal, exposed on the mounted root of every artifact and widget in the playground, that tells the harness the artifact is mounted and interactive.
- **Playground artifact registry entry**: the record that makes an artifact selectable in the playground and tells the preview iframe which bundle to load.
- **Features-package contract**: the existing agreement (package type, domain, exported feature/step/support directories) by which the runner discovers and loads a features package. Unchanged by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can see the draw-comments widget running in the playground and complete a full annotate→send→respond cycle without any real Claude environment and without editing code.
- **SC-002**: A single command runs every draw-comments behaviour specification against the real widget in a browser and reports pass/fail; before this feature, zero of them exercised the widget's user interface.
- **SC-003**: All 13 scenarios of the existing draw-comments suite are retained: 12 pass by driving the widget's user interface, and the one needing a non-browser document environment is reported as skipped. None fails and none disappears.
- **SC-004**: The two features packages share zero duplicated browser-harness code: the generic setup exists in exactly one place in the repository.
- **SC-005**: Adding a third features package requires no new harness code — only `.feature` files, domain step definitions, package metadata, and the artifact's own targets.
- **SC-006**: All list-artifact scenarios that passed before the harness move still pass after it, with the same count of passing scenarios.
- **SC-007**: The doctor command reports every check OK for the draw-comments features package against a running playground.
- **SC-008**: Architecture linting reports both features packages as conformant, and the whole workspace's quality gate (lint, typecheck, architecture, dead-code) passes.
- **SC-009**: A developer who breaks a widget control sees a failing named scenario with a screenshot, rather than a timeout with no diagnosis.
- **SC-010**: Both features packages remain publishable after taking their dependency on the shared harness — a packaging dry run of each succeeds.

## Assumptions

- The draw-comments features package keeps its current name, so its `domain` value is the package name minus the `-features` suffix; no rename is needed to satisfy the naming and consistency rules.
- The playground's existing Claude completion simulator is sufficient to drive the widget's Claude round trip; no new simulator capability is needed.
- The playground's existing storage and plugin request interception, moved into the harness, applies harmlessly to an artifact that enables no plugins — the draw-comments widget is expected to declare no available plugins.
- The runner's features-package contract (package type, domain, exported directories) is already correct for this feature and does not change; only the harness the runner supplies grows.
- The widget's existing accessible labels on its controls are sufficient for role-and-name locators; any gap is closed by adding accessible names rather than by resorting to brittle structural selectors.
- The behaviour specifications' *intent* is preserved by the conversion; wording may change where a step must describe an observable outcome instead of a domain transition.
- Scenario-level parallelism is out of scope — runs stay sequential, as they are today.
- Actually publishing the draw-comments features package to npm is out of scope; what must hold is that nothing about the harness dependency blocks it. The runner package itself does become publishable as part of this feature, since the features packages import its harness entry point.
- Exposing the shared readiness marker on the draw-comments widget's root is an additive change to the widget and does not otherwise subject a `widget`-type package to the Artifact Contract.
- A feature branch is created before any change lands, per the repository's git workflow.
