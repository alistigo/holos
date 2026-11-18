---
description: "Task list for the draw-comments end-to-end harness feature"
---

# Tasks: Draw-Comments End-to-End Features via the Generic Runner

**Input**: Design documents from `/specs/003-draw-comments-e2e-harness/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: Test tasks ARE included and are the point of the feature. The `.feature` files are
the source of truth under constitution principle IV, and the spec's own success criteria are
scenario pass counts. Feature-file rewording (T046–T048) precedes the step-definition rewrite
(T049), which precedes the run (T063): the scenarios must be red before they are green.

**Organization**: Grouped by user story. **Phases run in dependency order, not raw priority
order** — see the note below.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`–`US4` from [spec.md](./spec.md); Setup, Foundational and Polish carry none
- Every task names the exact file it touches

## Path Conventions

This is a pnpm + Nx monorepo (plan.md "Project Type"). Paths are repo-relative:

- `cli/artifact-features-runner-playwright/` — the runner CLI, which gains the harness
- `packages/list-features/`, `packages/artifact-ai-draw-comments-features/` — features packages
- `packages/artifact-ai-draw-comments/` — the widget under test
- `packages/artifact-manager/`, `apps/alistigo-artifact-playground/` — registry and playground

## ⚠️ Phase order deviates from story priority — deliberately

Spec priorities are US1 (P1), US2 (P1), US3 (P1), US4 (P2). The real dependency graph forces
a different order, because **US2 is the verification of the other three**:

```text
         ┌──────────────────────────────┐
         │ Phase 2: Foundational        │  runner publishable + /harness entry point
         └───────────┬──────────────────┘
             ┌───────┴────────┐
             ▼                ▼
      Phase 3 (US3)    Phase 4 (US1)      ← fully parallel: no shared file
      harness move     playground + widget
             │                │
             └───────┬────────┘
                     ▼
              Phase 5 (US4)               ← step definitions import the harness (US3)
              features conversion            and drive the widget in the playground (US1)
                     │
                     ▼
              Phase 6 (US2)               ← the suite can only run once US1+US3+US4 land
              runner flags + Nx targets
```

Running US2 earlier would produce a checkpoint that cannot pass, which defeats the purpose of
a checkpoint. US3 is placed before US1 only because it is the riskier move and the list suite
makes a harness regression cheap to find; the two phases are otherwise independent.

---

## Phase 1: Setup

**Purpose**: Capture the regression baseline before anything changes, and install what the
harness needs.

- [X] T001 Record the `artifact-list` e2e baseline in `specs/003-draw-comments-e2e-harness/baseline.md` — run `pnpm nx run artifact-list:test:e2e`, then write down the scenario pass count, the step count, and today's date. This is the acceptance threshold for SC-006 and the only way to attribute a later list failure to the F1 change rather than to the harness move (quickstart step 1). **Do this first — it is unrecoverable once the bundle route lands.**
- [X] T002 Add `"html-to-image": "1.11.13"` to `devDependencies` in `cli/artifact-features-runner-playwright/package.json` — pinned exactly, because the srcdoc's cdnjs `integrity` hash is version-specific (research F4)
- [X] T003 Run `pnpm install` from the repo root to link the new dependency

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Turn the runner into a publishable library with a second entry point. Both US3
and US4 import from that entry point, so nothing else can start until it resolves.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Make the runner publishable in `cli/artifact-features-runner-playwright/package.json` — remove `"private": true`; add `"exports"` with `"."` → `./dist/index.js` + `./dist/index.d.ts` and `"./harness"` → `./dist/harness/index.js` + `./dist/harness/index.d.ts`; add `"files": ["dist"]`, `"publishConfig": { "access": "public" }`, `"license": "MIT"`, `"author"`, `"repository"` (with `"directory": "cli/artifact-features-runner-playwright"`), `"bugs"`, `"homepage"`, `"keywords"`; keep `"bin"` and `"alistigo": { "type": "infrastructure" }` unchanged (contracts/harness-api.md)
- [X] T005 Create `cli/artifact-features-runner-playwright/src/index.ts` as the `"."` entry point, re-exporting the library surface (`loadFeaturesPackage`, `validateHost`, the `CheckResult` types) — **must not import `clipanion` or anything under `src/commands/`**, so `bin` stays the only CLI path
- [X] T006 [P] Create `cli/artifact-features-runner-playwright/src/harness/test-ids.ts` exporting `PLATFORM_TEST_IDS` as `{ app: "alistigo-app", actionPending: "action-pending" } as const` — the platform readiness contract lifted out of `packages/list-features/src/support/selectors.ts` (data-model.md §3)
- [X] T007 Confirm `cli/artifact-features-runner-playwright/tsconfig.json` emits declarations and preserves the `src/harness/` directory structure into `dist/harness/`; adjust `outDir`/`rootDir`/`declaration` if it does not
- [X] T008 Verify the entry-point split: `pnpm nx run artifact-features-runner-playwright:build`, then `node --input-type=module -e "const h = await import('./cli/artifact-features-runner-playwright/dist/harness/index.js'); console.log(Object.keys(h))"` resolves without pulling in `clipanion` (the harness/index.ts added in T013 makes this meaningful; a stub export is enough to check it now)

**Checkpoint**: `@alistigo/artifact-features-runner-playwright/harness` resolves. US3 and US1 can now proceed in parallel.

---

## Phase 3: User Story 3 — Shared harness lives in the runner (Priority: P1)

**Goal**: Move every generic piece of browser setup out of `list-features` and into the
runner's harness, leaving `list-features` with only list-domain content.

**Independent Test**: `grep` finds no browser lifecycle, World constructor or playground
navigation in either features package, **and** the `artifact-list` suite still passes the
count recorded in T001 (quickstart steps 2, 6, 7).

### Harness implementation

- [X] T009 [US3] Create `cli/artifact-features-runner-playwright/src/harness/world.ts` with `ArtifactWorld extends World` per data-model.md §1 — fields `baseUrl` (`PLAYWRIGHT_BASE_URL` → `ALISTIGO_APP_URL` → `http://localhost:4173`), `artifact` (from `ARTIFACT_FEATURES_ARTIFACT`, `undefined` meaning "use the playground's default"), `browser`, `context`, `page`, `playgroundPage`, `pageErrors`; methods `beforeScenario(browser)` (throws if called with a different browser than an earlier call; installs routes **before** the first navigation, then opens the playground), `afterScenario()` (closes page then context, swallowing errors, never throws), `seedStorage(entries: Record<string, string>)` (clears `localStorage`, writes the entries, reloads, waits for readiness), `reloadArtifact()`, `enablePlugin(packageName)`, `setPluginConfig(config)`. Ported from `packages/list-features/src/support/world.ts` with `setDocument` and its `@alistigo/list-document` import **left behind**
- [X] T010 [US3] Create `cli/artifact-features-runner-playwright/src/harness/playground.page.ts` with `PlaygroundPage` per data-model.md §2 — `artifactFrame` (`iframe[title="Artifact preview"]`), `previewFrame` (frame named `artifact-preview`), `open()` (navigate; if `artifact` is set, select it in the combobox named `Artifact` and await the `framenavigated` event for the preview frame; then `waitForArtifactReady()`), `selectArtifact(name)` (fails naming the offered options when absent), `waitForArtifactReady()` (waits for `[data-testid="alistigo-app"]` visible inside `artifactFrame`), `reload()`, `enablePlugin(name)`, `fillPluginConfig(name, json)`. **No locator may name a domain concept** — no list rows, no draw-comment controls
- [X] T011 [US3] Create `cli/artifact-features-runner-playwright/src/harness/routes.ts` per data-model.md §4 — `installBundleRoute(page, packageName, jsSource)` (fulfils with `content-type: application/javascript; charset=utf-8` **and** `access-control-allow-origin: *`, since a cross-origin dynamic `import()` fetches in CORS mode with no upstream response to inherit from) plus `installDefaultRoutes(page)` installing: (a) `https://cdn.jsdelivr.net/npm/@alistigo/**` → parse the package name back out of the URL, strip the `@0` major pin, resolve the package in the workspace, serve its local `dist/` build, **falling through to the network when no local build exists** (F1); (b) the dev-server plugin path `**/<unscoped-name>/src/**`; (c) the Claude storage stub whose `storage.isAvailable()` returns `false`; (d) the cdnjs `html-to-image` URL from the locally installed copy (F4). Resolution is **by package name from the workspace, never a hard-coded relative path** — the `../../../../packages/local-storage-plugin/dist/index.js` read in the old `storage-routes.ts` is a `no-cross-package-relative-import` violation and must not survive. Bundle reads must be lazy and tolerant of a missing build, not top-level `readFileSync`
- [X] T012 [US3] Create `cli/artifact-features-runner-playwright/src/harness/register.ts` as the side-effect registration module, ported from `packages/list-features/src/support/hooks.ts` — `setDefaultTimeout(30_000)`; `BeforeAll` launching one chromium (honouring `HEADED !== "1"` and `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`); `AfterAll` closing it; `Before({ tags: "@todo" })` returning `"skipped"` so no context is created; `Before({ tags: "not @todo" })` calling `world.beforeScenario(browser)`; `After` calling `afterScenario()`; `AfterStep` attaching a PNG screenshot when `result.status === "FAILED"`; and `setWorldConstructor(ArtifactWorld)` **last**
- [X] T013 [US3] Create `cli/artifact-features-runner-playwright/src/harness/index.ts` exporting `ArtifactWorld`, `PlaygroundPage`, `PLATFORM_TEST_IDS`, `installBundleRoute`, `installDefaultRoutes` and their types, exactly as contracts/harness-api.md lists. Importing this module must register nothing — registration is `register.ts` alone
- [X] T014 [US3] In `cli/artifact-features-runner-playwright/src/commands/run.ts`, put the compiled `harness/register.js` **first** in the Cucumber `import` list, ahead of `stepDefinitionsDir` and `supportDir`. Order is part of the contract: `setWorldConstructor` is last-call-wins, so the harness must register the base World before a features package overrides it (research D2, contracts/runner-cli.md)

### Strip the generic half out of list-features

- [X] T015 [US3] Add `"@alistigo/artifact-features-runner-playwright": "workspace:*"` to `devDependencies` in `packages/list-features/package.json` and run `pnpm install`
- [X] T016 [US3] Delete `packages/list-features/src/support/hooks.ts`, `packages/list-features/src/support/plugin-route.ts` and `packages/list-features/src/support/storage-routes.ts` — all three now live in the harness (research D3). Note `storage-routes.ts`'s `installUserPluginRoute` is a documented no-op; carry its comment into the harness rather than losing it
- [X] T017 [US3] Rewrite `packages/list-features/src/support/world.ts` as `ListWorld extends ArtifactWorld` imported from `@alistigo/artifact-features-runner-playwright/harness`, keeping only `setDocument(document: AlistigoDocument)` (implemented as `seedStorage({ document: JSON.stringify(document) })`), the plugin-under-test fixture wiring (`setPluginUnderTest`, `initializeArtifactWithPlugin`) and `setWorldConstructor(ListWorld)`. It must call `super.beforeScenario(browser)` first if it overrides that method
- [X] T018 [US3] Edit `packages/list-features/src/support/selectors.ts` to drop `TEST_IDS.app` and `TEST_IDS.actionPending` (now `PLATFORM_TEST_IDS` in the harness) and keep the list-domain entries — `ROLES.addInput`, `addSubmit`, `list`, `row`, `rowDelete`, `rowCheckbox`, `userMenu`, `editUser`, `pseudoInput`, `TEST_IDS.emptyState`, `badge`, `userPseudo`, and `deleteButtonName()`
- [X] T019 [US3] Rename `packages/list-features/src/pages/application.page.ts` to `packages/list-features/src/pages/list-application.page.ts` and make it `extends PlaygroundPage` — remove `open`, `waitForArtifactReady`, `reload` and the private `artifactFrame` getter (all inherited) and keep only the list interactions: `addElement`, `deleteElement`, `deleteRow`, `getListItems`, `isEmptyStateVisible`, `checkElement`, `uncheckElement`, `isElementChecked`, `areAllElementsUnchecked`, `setPseudo`, `getUserPseudo`, `openUserEditor`, `waitForUserIdentity`, the plugin probes, and the private `waitForIdle`/`waitForCheckboxPluginReady` helpers
- [X] T020 [US3] Update the imports in `packages/list-features/src/step-definitions/setup.steps.ts`, `actions.steps.ts` and `assertions.steps.ts` to take the World type from the local `ListWorld` and the platform ids from the harness; no step logic changes
- [X] T021 [US3] Rebuild and run the list suite: `pnpm nx run artifact-features-runner-playwright:build && pnpm nx run list-features:build && pnpm nx run artifact-list:test:e2e`. The pass count must equal T001's. A drop here is a harness regression, not F1 — the bundle route does not exist yet
- [X] T022 [US3] Verify the harness is one module instance, not two — from `packages/artifact-list`, run `HEADED=0 bun ../../cli/artifact-features-runner-playwright/dist/cli.js --target=@alistigo/list-features --host=http://localhost:4173` (quickstart step 2) and confirm **one** chromium launch and no duplicate World registration. Node keys its ESM cache on the resolved file URL and follows symlinks, so the pnpm link and the absolute path should land on the same realpath. If two browsers launch, apply research D2's fallback in `cli/artifact-features-runner-playwright/src/commands/run.ts` — import the harness through the same bare specifier handed to Cucumber rather than an absolute path
- [X] T023 [US3] Verify nothing generic is left behind: `grep -rnE "BeforeAll|AfterAll|chromium\.launch|page\.goto" packages/list-features/src` returns nothing, and `grep -rn '\.\./\.\./\.\./\.\.' packages/list-features/src` returns nothing (quickstart step 7)

**Checkpoint**: The harness owns browser setup, the list suite is green at baseline, and `list-features` holds only list-domain code. US3 is complete and independently verified.

---

## Phase 4: User Story 1 — The widget runs in the playground (Priority: P1)

**Goal**: Make `@alistigo/artifact-ai-draw-comments` selectable in the playground and able to
complete a full annotate → send → respond cycle against the Claude simulator.

**Independent Test**: Open the dev playground, select the artifact, draw and send an
annotation, see the simulated response — with no code edits and no real Claude environment
(quickstart step 3).

**Parallel with Phase 3**: shares no file with US3.

### Playground registration

- [X] T024 [P] [US1] **Append** the draw-comments entry to `ARTIFACT_REGISTRY` in `packages/artifact-manager/src/registry.ts` per data-model.md §6 — key `@alistigo/artifact-ai-draw-comments`, `cdnUrl: "https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"` (the `@0` major pin is mandatory per ADR-0011 — never version-less), `skillPackage: "@alistigo/artifact-ai-draw-comments-skill"`, `availablePlugins: []`. **Append, do not insert** — `KNOWN_APPS[0]` is the playground's landing default and must stay `@alistigo/artifact-list` so US3's list scenarios keep working untouched (research F5)
- [X] T025 [P] [US1] Add `"@alistigo/artifact-ai-draw-comments": "workspace:*"` to `dependencies` in `apps/alistigo-artifact-playground/package.json` and run `pnpm install`
- [X] T026 [US1] Add a source alias for the widget in `apps/alistigo-artifact-playground/vite.config.ts` — a `drawCommentsSrc` const resolving `../../packages/artifact-ai-draw-comments/src/index.tsx`, registered in `resolve.alias` beside the two existing artifact aliases, so dev mode serves source rather than `dist`
- [X] T027 [US1] Extend the `switch (app)` in `apps/alistigo-artifact-playground/src/artifact-entry.tsx` with a `case "@alistigo/artifact-ai-draw-comments"` that renders the host surface (T028) **before** `await import("@alistigo/artifact-ai-draw-comments")`, so the widget's `auto-mount` `prepend` lands above it
- [X] T028 [US1] Add the static host surface to `apps/alistigo-artifact-playground/src/artifact-entry.tsx` per data-model.md §7 — a heading and two paragraphs of static prose modelled on `packages/artifact-ai-draw-comments/demo/index.html`, carrying `data-testid="draw-comments-host-surface"`, large enough that a region well above the overlay's 20×20 px minimum can be dragged over it. Build it with plain DOM in this vanilla entry module, **not** as a React component — a `.tsx` component would require a co-located Storybook story under ADR-0012, and this is test scaffolding, not UI. Required by `embed-host` and by `draw-comment-send` scenario 5, which otherwise have no host content to be visible (research F2a)

### Widget changes

- [X] T029 [P] [US1] In `packages/artifact-ai-draw-comments/src/App.tsx`, add `data-testid="alistigo-app"` to the root `div.ai-draw-comments` and make that root `position: relative` — the marker is the single readiness contract the harness waits on (Q3 → A, data-model.md §3), and the positioning anchors the absolutely-positioned region div predictably. Adding the marker does **not** subject this `widget`-type package to the rest of the Artifact Contract
- [X] T030 [P] [US1] Fix the double offset in `packages/artifact-ai-draw-comments/src/components/DrawCanvas.tsx` — its wrapper `div` re-applies `left: region.x; top: region.y` while already nested inside `App`'s region div, which carries the same offset, so the canvas renders at `2 × region`. Make the inner wrapper fill its parent (`inset-0`) instead. `draw-comment-send` scenario 4 ("a transparent drawing canvas overlay appears **on top of the selected region**") is the test that catches this (research F2b)

### Claude simulator fix

- [X] T031 [P] [US1] In `apps/alistigo-artifact-playground/src/hooks/useClaudeCompleteSimulator.ts`, widen `AiLogEntry.prompt` to accept the array-of-content-blocks shape the widget sends via `window.claude.complete([{type:"image",…},{type:"text",…}])`, and derive a display string for the log entry (e.g. `image + "<the text block>"`) while keeping the raw value. The response path (`postMessage({ type: "claudeComplete", id, completion })`) is unchanged (research F3)
- [X] T032 [US1] In `apps/alistigo-artifact-playground/src/components/ClaudeSimulator.tsx`, render the derived display string instead of `{entry.prompt}` / `title={entry.prompt}`. Rendering an array of plain objects as a React child throws "Objects are not valid as a React child" and takes down the **host page** — not the iframe — the instant Send is clicked (research F3)

### Verification

- [X] T033 [US1] Verify the widget in the dev playground per quickstart step 3 — `pnpm nx run alistigo-artifact-playground:dev`, select the artifact, confirm the host surface renders with the "Draw Comment" button above it, then complete a full cycle (drag a region over the prose, draw a rectangle, type a comment, Send) and confirm the thread shows the annotation image, the comment, and the simulator's response, with one entry logged in the Claude Simulator tab
- [X] T034 [US1] Verify graceful degradation and no cross-contamination — with `AI Context` = `none` the button is disabled, the "window.claude is not available" banner shows and the console carries no uncaught error (FR-003); switching back to `@alistigo/artifact-list` mounts it normally (FR-005)

**Checkpoint**: The widget is usable in the playground by hand. US1 is complete and independently verified.

---

## Phase 5: User Story 4 — The features package conforms to the contract (Priority: P2)

**Goal**: Convert `@alistigo/artifact-ai-draw-comments-features` from a self-contained
in-process Cucumber project into a conformant `features` package whose scenarios drive the
widget's UI.

**Independent Test**: `pnpm nx run holos:qa:artifact-arch-check` reports it conformant with no
`features/*` violations, and the runner can resolve and load it (quickstart step 8).

**Depends on**: Phase 3 (step definitions import the harness) and Phase 4 (they drive the
widget in the playground).

### Package metadata and layout

- [X] T035 [US4] Rewrite the manifest fields in `packages/artifact-ai-draw-comments-features/package.json` per data-model.md §5 — `alistigo.type` `"application"` → `"features"`; add `alistigo.domain: "artifact-ai-draw-comments"` (the unscoped name minus `-features`, which is what `features/domain-consistent` compares against, so **no rename is needed**); add `exports["."]` → `./dist/index.js` + `./dist/index.d.ts`, `main`, `types`; change `files` from `["features"]` to `["dist", "features"]`; **remove** the `dependencies` entry on `@alistigo/artifact-ai-draw-comments` (after conversion the package has no reason to import the widget's domain layer, which tightens the DDD boundary); add `devDependencies` on `@alistigo/artifact-features-runner-playwright` and `playwright`, and `peerDependencies` on `@cucumber/cucumber` + `playwright`, mirroring `packages/list-features/package.json`
- [X] T036 [US4] Move `packages/artifact-ai-draw-comments-features/step-definitions/` to `packages/artifact-ai-draw-comments-features/src/step-definitions/` — the runner loads **compiled** step definitions, and this package's currently sit uncompiled at the package root where `@nx/js:tsc` cannot emit them
- [X] T037 [US4] Create `packages/artifact-ai-draw-comments-features/src/index.ts` exporting `FEATURES_DIR` (`<dist>/../features`), `STEP_DEFINITIONS_DIR` (`<dist>/step-definitions`) and `SUPPORT_DIR` (`<dist>/support`) as absolute paths resolved from `fileURLToPath(import.meta.url)`, modelled on `packages/list-features/src/index.ts`
- [X] T038 [US4] Replace the `build` target in `packages/artifact-ai-draw-comments-features/project.json` with the `@nx/js:tsc` executor (`outputPath` `dist`, `main` `src/index.ts`, `rootDir` `src`), **delete the `test` target** that invokes Cucumber in process (FR-023 — the runner becomes the only execution path), and add `typecheck`, `format` and `format:check` targets mirroring `packages/list-features/project.json`
- [X] T039 [US4] Delete `packages/artifact-ai-draw-comments-features/cucumber.json` — the runner composes the Cucumber configuration itself, and leaving a profile behind gives the package two ways to run the same scenarios
- [X] T040 [US4] Update `include` in `packages/artifact-ai-draw-comments-features/tsconfig.json` from `["step-definitions/**/*.ts", "gherklin.config.ts"]` to cover `src/**/*.ts`, and align `compilerOptions` with `packages/list-features/tsconfig.json` so declarations emit
- [X] T041 [US4] Add `.prettierrc.json` and `.prettierignore` to `packages/artifact-ai-draw-comments-features/`, copied from `packages/list-features/`, so the `prettier-plugin-gherkin` formatting the `format` target applies is identical across both features packages (the package already carries `prettier` and `prettier-plugin-gherkin` in `devDependencies` but has no config)

### Domain support code

- [X] T042 [US4] Create `packages/artifact-ai-draw-comments-features/src/support/selectors.ts` with the widget's accessible roles and names, taken from the components rather than guessed — `drawCommentButton` (`button` / "Draw Comment"), `selectionOverlay` (`presentation` / "Drag to select annotation area"), `cancelSelection` (`button` / "Cancel selection"), `cancelAnnotation` (`button` / "Cancel annotation"), `commentInput` (`textbox` / "Annotation comment"), `sendButton` (`button` / "Send"), `rectangleTool` / `lineTool` (`button` / "Rectangle", "Line"), `annotationImage` (`img` / "Annotated region"), `dismissError` (`button` / "Dismiss error"), plus `hostSurface` (`data-testid="draw-comments-host-surface"`). Roles and accessible names first; a test id only where no accessible name disambiguates (FR-028)
- [X] T043 [US4] Create `packages/artifact-ai-draw-comments-features/src/support/draw-comments.page.ts` with `DrawCommentsPage extends PlaygroundPage` (imported from `@alistigo/artifact-features-runner-playwright/harness`) exposing the widget interactions: `startAnnotation()`, `dragRegion(box)` (via `page.mouse.move/down/up` — the overlay uses React `onMouseDown/Move/Up` with `clientX/Y` and enforces a 20×20 px minimum, so drag comfortably larger), `drawShape(box)` (same mouse sequence over the Konva `<canvas>`, whose stage handles Konva's own mouse events), `selectTool(tool)`, `typeComment(text)`, `send()`, `cancelFromSelection()`, `cancelFromDrawing()`, and read-side helpers `isDrawCommentEnabled()`, `isSendEnabled()`, `isOverlayAttached()`, `isCanvasAttached()`, `canvasBoundingBox()`, `annotationImageSrc()`, `responseText()`, `commentText()`, `isHostSurfaceVisible()`
- [X] T044 [US4] Create `packages/artifact-ai-draw-comments-features/src/support/world.ts` with `DrawCommentsWorld extends ArtifactWorld` holding the per-scenario domain state the steps share (the selected region box, the drawn shape box, the comment text, the page-load counter used by the no-reload assertion), replacing `playgroundPage` with a `DrawCommentsPage` in an overridden `beforeScenario` that calls `super.beforeScenario(browser)` **first**, then `setWorldConstructor(DrawCommentsWorld)`. It must not register any `BeforeAll`/`AfterAll` hook (contracts/features-package.md)

### Reword the feature files (red before green)

- [X] T045 [US4] Reword `packages/artifact-ai-draw-comments-features/features/draw-comment-send.feature` — all 8 scenarios, per the mapping table in research.md D5. The substantive changes: scenario 5's "a rectangle shape is drawn on the overlay" becomes the widget's own proof a shape landed (**the Send button becomes enabled** — `CommentInput` computes `sendable = shapes.length > 0 || comment.trim().length > 0`), and its "the underlying artifact content remains fully visible through the canvas" becomes an assertion that the host surface stays visible; scenario 6's "a PNG image is generated combining the region capture and the drawn shapes" becomes "the annotated image appears in the conversation" (an `img[alt="Annotated region"]` with a non-empty `data:image/png;base64,…` src). Preserve each scenario's intent and its `@P1` tag
- [X] T046 [US4] Reword `packages/artifact-ai-draw-comments-features/features/claude-response.feature` — 3 scenarios. Note that `App.doSend` awaits both the snapshot and the Claude response before dispatching `AnnotationSent` and `ClaudeResponded` together, so the "sent, awaiting response" state (`AnnotationThread`'s "Claude is thinking…" branch) is unreachable through the UI: scenario 1 asserts the end state (the response rendered under the annotation) rather than the intermediate one. "the page does not reload" becomes an assertion over a counter stamped on `window` at load, which survives iff no reload occurred
- [X] T047 [US4] Reword `packages/artifact-ai-draw-comments-features/features/embed-host.feature` — retag scenario 1 from `@jsdom-required` to `@todo` so the runner's existing `not @todo` filter reports it as **skipped** rather than failing or vanishing (FR-027); reword scenario 2 to assert the annotation image reaches the thread **and** the host surface was visible during the session, **not** pixel content. Add a comment in the file recording research F6: the composite PNG captures only the overlay subtree, never the host content behind it, so the pixel-level claim does not hold and is tracked as a separate defect
- [X] T048 [US4] Run `pnpm nx run artifact-ai-draw-comments-features:format` and `:qa:lint` so the reworded Gherkin is `prettier-plugin-gherkin`-formatted and passes `gherklin` before any step definition is written

### Rewrite the step definitions

- [X] T049 [US4] Rewrite all three files under `packages/artifact-ai-draw-comments-features/src/step-definitions/` — `draw-comment-send.steps.ts`, `claude-response.steps.ts`, `embed-host.steps.ts` — as UI interactions against `DrawCommentsWorld`/`DrawCommentsPage`, deleting every `projectSession`/`SessionEventLog` assertion and the local `setWorldConstructor(ScenarioWorld)` + `Before` hook in `claude-response.steps.ts`. These are rewrites, not edits: every step changes from a domain assertion to a browser interaction. Steps that exercise the Claude round trip must **await the response element** rather than assume synchrony, and must not assert on the simulator's default canned response text (FR-029)
- [X] T050 [US4] Port the deleted domain assertions to `packages/artifact-ai-draw-comments/src/domain/session.test.ts` as `bun test` cases — the `projectSession` status transitions (`idle` → `selecting` → `drawing` → `submitting` → `sent` → `responded`, and `AnnotationCancelled` from each active state), `canSend`, and snapshot presence after `AnnotationSent`. This is the mitigation recorded in plan.md's Complexity Tracking for constitution principle IV: Q1 → A removes the in-process Gherkin layer, and this keeps the domain-level coverage it provided. The widget currently has no unit tests at all, so this is net coverage gained
- [X] T051 [US4] Add a `test` target running `bun test` to `packages/artifact-ai-draw-comments/project.json` (the project has `build`, `typecheck`, `qa:lint`, `storybook`, `build-storybook`, `demo` and `clean`, but no `test`) and confirm T050's cases pass
- [X] T052 [US4] Verify conformance: `pnpm nx run artifact-ai-draw-comments-features:build` emits `dist/step-definitions/` and `dist/support/`, and `pnpm nx run holos:qa:artifact-arch-check` reports the package as a `features` package with no `features/naming-convention`, `domain-required`, `domain-consistent` or `domain-unique` violations

**Checkpoint**: The package is conformant and loadable, its scenarios are reworded and its step definitions drive the UI. US4 is complete.

---

## Phase 6: User Story 2 — The suite runs through the generic runner (Priority: P1)

**Goal**: One Nx target boots the playground, runs every draw-comments scenario in a browser,
tears down, and exits non-zero on failure.

**Independent Test**: `pnpm nx run artifact-ai-draw-comments:test:e2e` on a clean checkout
reports 12 passed / 1 skipped and exits 0; breaking a widget control makes it exit 1 with a
named scenario and a screenshot (quickstart step 5).

**Depends on**: Phases 3, 4 and 5 — this phase is their verification.

### Runner flags and diagnostics

- [X] T053 [US2] Add `--artifact` to `cli/artifact-features-runner-playwright/src/commands/run.ts` per contracts/runner-cli.md, mirroring `doctor`'s flag, and export it to the harness as `ARTIFACT_FEATURES_ARTIFACT` beside the existing `PLAYWRIGHT_BASE_URL` and `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`. Omitted → the harness leaves the Artifact selector alone and the playground's default is used, preserving today's `list-features` behaviour exactly (FR-033). Provided but not offered by the playground → fail before any scenario runs, printing the offered list
- [X] T054 [US2] Add the `Local bundle` check to `cli/artifact-features-runner-playwright/src/commands/doctor.ts` and `src/lib/playground.ts` — **warn** (never fail) when the selected artifact has no local `dist/` build, naming the consequence: the preview will fetch the published bundle from jsDelivr instead of the working tree, so source-only changes such as the readiness marker will appear absent. Warn rather than fail so `doctor` stays usable against a published deployment
- [X] T055 [US2] Update the usage examples and flag table in `cli/artifact-features-runner-playwright/src/commands/run.ts`'s `Command.Usage` to cover `--artifact`

### Nx targets

- [X] T056 [US2] Add `test:e2e` to `packages/artifact-ai-draw-comments/project.json` per contracts/runner-cli.md — `dependsOn` the playground build, the runner build, the features-package build **and this widget's own build** (the harness now serves the local bundle over the CDN URL, so an unbuilt widget means the published bundle loads instead); start `vite preview`, poll `http://localhost:4173` until it answers or 30 tries elapse, run `bun ../../cli/artifact-features-runner-playwright/dist/cli.js --target=@alistigo/artifact-ai-draw-comments-features --artifact=@alistigo/artifact-ai-draw-comments --host=http://localhost:4173`, kill the preview, propagate the exit status. Invoke the runner as `bun <path>/dist/cli.js` — **never** `pnpm <bin>`, because pnpm's bin symlinks need `dist/` to exist at install time, which it does not in CI
- [X] T057 [US2] Add `test:e2e-attach` and `test:e2e-doctor` to `packages/artifact-ai-draw-comments/project.json` — the same `--target`/`--artifact` pair against an already-running playground, and the `doctor` subcommand. All three targets live in `project.json` only, never duplicated as `package.json` scripts (FR-032)

### Verification

- [X] T058 [US2] Run `pnpm nx run artifact-ai-draw-comments:test:e2e-doctor` against a running playground and confirm every check OK (SC-007) — including `Artifact selector` selecting `@alistigo/artifact-ai-draw-comments`, `Preview config` reporting it, `Artifact mount`, and `Local bundle` **OK rather than a warning**
- [X] T059 [US2] Run `pnpm nx run artifact-ai-draw-comments:test:e2e` and confirm `13 scenarios (12 passed, 1 skipped)` with exit 0 — SC-003 exactly. The skipped one is `embed-host`'s script-tag mount
- [X] T060 [US2] Prove the failure path (SC-009) — change the `aria-label` on the button in `packages/artifact-ai-draw-comments/src/components/DrawCommentButton.tsx`, rebuild, re-run, and confirm a **named failing scenario with a screenshot attached** and exit 1, not a bare timeout. Revert the change
- [X] T061 [US2] Re-run `pnpm nx run artifact-list:test:e2e` and compare the pass count against `specs/003-draw-comments-e2e-harness/baseline.md` (SC-006). This is the run where the F1 risk can materialise: the list suite now exercises the local build instead of the published jsDelivr bundle, so a previously masked `artifact-list` regression surfaces here. Investigate any drop; **do not rebase the baseline**
- [X] T062 [US2] Confirm `pnpm nx run artifact-list:test:e2e-attach` and `:test:e2e-doctor` still work unchanged (FR-033)

**Checkpoint**: All four user stories are complete and independently verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T063 [P] Document the harness in `cli/artifact-features-runner-playwright/README.md` — the `./harness` entry point and its exported surface, the registration-order contract, the breaking-change rules from contracts/harness-api.md, the new `--artifact` flag and `Local bundle` check, the bundle-route behaviour (local build served over jsDelivr, falling through to the network), and a rewritten "Adding a new features package" section reflecting that a new package writes only `.feature` files, step definitions, domain locators and fixtures (FR-034, SC-005)
- [X] T064 [P] Rewrite `packages/artifact-ai-draw-comments-features/README.md` for the new model — how the scenarios run (via the runner against the playground, not in process), what the package contains and deliberately does not, and an explicit "Known gap" section recording research F6: the composite PNG captures only the overlay subtree, never the host content behind it, so no scenario asserts pixel content. The gap must be visible in the docs rather than implied by a green suite
- [X] T065 [P] Update `packages/list-features/README.md` and `packages/list-features/docs/organization.md` wherever they describe the `src/support/` layout, since `hooks.ts`, `plugin-route.ts` and `storage-routes.ts` no longer exist there
- [ ] T066 [FOLLOW-UP] Make the annotated PNG capture the host content behind the overlay, in `packages/artifact-ai-draw-comments/src/application/snapshot-builder.ts` — it captures `regionEl`, whose subtree holds only the Konva canvas, so the composite carries the drawn shapes on a transparent background and never the host page behind them (research F6). Changing what the widget screenshots is a behavioural change to its output and needs its own spec. Recorded in `packages/artifact-ai-draw-comments-features/README.md` under "Known gap" so a green suite does not imply the capture is correct. **Deliberately not filed as a GitHub issue — tracked here.**
- [ ] T067 [FOLLOW-UP] Model the dev-tools tier in `@alistigo/architecture` — the playground, the features runner, both features packages and the skill tester appear in no `.arch.json`, so constitution principle V's "declare new architectural elements before implementation" cannot be satisfied for them. Inherited from feature 002, which introduced the runner and the `features` package type without a CALM entry; `qa:arch-calm` validates only the files that exist, so it does not catch the omission. **Deliberately not filed as a GitHub issue — tracked here.**
- [X] T068 Run `pnpm biome check --write .` and stage every auto-fixed file in the same commit (constitution Git Discipline; memory `feedback_biome_before_push`)
- [X] T069 Run `pnpm nx run holos:qa` and confirm all gates pass — `qa:lint`, `qa:arch-check`, `qa:arch-calm`, `qa:dead-code`, `qa:audit`, `qa:stories-check`, `qa:artifact-arch-check`, `qa:artifact-sandbox-check` (SC-008). No `--no-verify` bypass; fix the underlying issue
- [X] T070 Verify publishability with pack dry runs (SC-010) — `pnpm -F @alistigo/list-features pack`, `pnpm -F @alistigo/artifact-ai-draw-comments-features pack` and `pnpm -F @alistigo/artifact-features-runner-playwright pack` into `/tmp`, then `tar -tzf` each: both features tarballs must contain `dist/` **and** `features/`, and the runner's must contain `dist/harness/`
- [X] T071 Walk the whole of `specs/003-draw-comments-e2e-harness/quickstart.md` end to end on a clean build and confirm each step's expected outcome, including step 7's greps and step 9's read-through of the features-package contract
- [ ] T072 Open the pull request with `gh pr create` from `feat/003-draw-comments-e2e-harness` — a conventional-commit title (`feat(artifact-features-runner-playwright): share the browser harness and convert draw-comments features`), a body linking `specs/003-draw-comments-e2e-harness/spec.md` and `plan.md`, an explicit note that `artifact-list:test:e2e` now exercises the local build rather than the published jsDelivr bundle (research F1), and the PR attribution line

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** — no dependencies. **T001 must run before any other task in the feature**; the baseline is unrecoverable once T011's bundle route changes what the list suite loads
- **Foundational (Phase 2)** — depends on Setup. **Blocks every user story**: both US3 and US4 import `@alistigo/artifact-features-runner-playwright/harness`
- **Phase 3 (US3)** and **Phase 4 (US1)** — depend on Foundational only, and are fully parallel with each other: US3 touches `cli/` and `packages/list-features/`, US1 touches `packages/artifact-manager/`, `apps/alistigo-artifact-playground/` and `packages/artifact-ai-draw-comments/`. No shared file
- **Phase 5 (US4)** — depends on **both** Phase 3 (its step definitions import the harness) and Phase 4 (they drive the widget in the playground)
- **Phase 6 (US2)** — depends on Phases 3, 4 and 5. It is the verification phase; running it earlier yields a checkpoint that cannot pass
- **Phase 7 (Polish)** — depends on Phase 6, except T063–T067, which only need the phase that created what they document

### User Story Dependencies

| Story | Priority | Depends on | Independently testable |
|---|---|---|---|
| **US3** — harness in the runner | P1 | Foundational | Yes — list suite green at baseline + greps (T021–T023) |
| **US1** — widget in the playground | P1 | Foundational | Yes — manual cycle in the dev playground (T033–T034) |
| **US4** — features-package conformance | P2 | US3, US1 | Yes — arch-check + build (T052) |
| **US2** — run via the runner | P1 | US3, US1, US4 | Yes — the three Nx targets (T058–T062) |

US2's dependence on the other three is inherent, not an artefact of this plan: a runner cannot
run scenarios that have not been converted against an artifact that is not in the playground.

### Within Each Phase

- Feature-file rewording (T045–T047) precedes the step-definition rewrite (T049), which
  precedes the run (T059): red before green, per constitution principle IV
- Harness modules (T009–T013) precede the `list-features` strip (T016–T020), which precedes
  the list-suite verification (T021)
- Playground registration (T024–T028) precedes the manual verification (T033)
- Package metadata and layout (T035–T041) precede the domain support code (T042–T044)

### Parallel Opportunities

- **T006** is parallel within Foundational (new file, no dependents yet)
- **Phase 3 and Phase 4 in full** — the largest win; two developers can take one each
- Within Phase 4: **T024, T025** (registry, playground manifest), **T029, T030** (two different widget files), **T031** (the simulator hook) are all parallel; T026/T027/T028 serialise on `vite.config.ts` → `artifact-entry.tsx`, and T032 follows T031 on the same data shape
- Within Phase 5: **T042, T043, T044** are three new files and parallel once T035–T041 land; **T045, T046, T047** are three different `.feature` files and parallel
- Within Phase 7: **T063–T067** are five different files/actions and parallel

---

## Parallel Example: Phases 3 and 4

```bash
# Two developers, after the Foundational checkpoint:

# Developer A — Phase 3 (US3): the harness move
Task: "T009 Create harness/world.ts with ArtifactWorld"
Task: "T010 Create harness/playground.page.ts with PlaygroundPage"
Task: "T011 Create harness/routes.ts with the bundle/plugin/storage/html-to-image routes"

# Developer B — Phase 4 (US1): playground + widget, in parallel
Task: "T024 Append the registry entry in packages/artifact-manager/src/registry.ts"
Task: "T025 Add the widget dependency to the playground package.json"
Task: "T029 Add data-testid=alistigo-app to the widget App root"
Task: "T030 Remove the duplicated region offset in DrawCanvas.tsx"
```

```bash
# Within Phase 5, once the package layout lands (T035–T041):
Task: "T042 Create src/support/selectors.ts with the widget's roles and names"
Task: "T043 Create src/support/draw-comments.page.ts extending PlaygroundPage"
Task: "T044 Create src/support/world.ts with DrawCommentsWorld"

# And the three feature files:
Task: "T045 Reword features/draw-comment-send.feature (8 scenarios)"
Task: "T046 Reword features/claude-response.feature (3 scenarios)"
Task: "T047 Reword features/embed-host.feature (retag scenario 1 @todo)"
```

---

## Implementation Strategy

### MVP scope

The MVP is **Phase 1 + Phase 2 + Phase 3 (US3)** — the harness extracted into the runner with
the list suite still green. It delivers standalone value even if the feature stops there: the
duplication the user asked about is gone, the cross-package relative-path violation is gone,
and any third features package now plugs in without harness code (SC-004, SC-005).

Note this is **not** the spec's User Story 1. US1 is independently valuable but delivers only
manual playground use; US3 is the piece that changes the codebase's shape.

### Incremental delivery

1. Phase 1 + 2 → the harness entry point resolves
2. Phase 3 (US3) → **validate**: list suite at baseline, greps clean → demo (MVP)
3. Phase 4 (US1) → **validate**: a full annotate-send-respond cycle by hand → demo
4. Phase 5 (US4) → **validate**: arch-check conformant, package builds
5. Phase 6 (US2) → **validate**: 12 passed / 1 skipped, failure path proven → demo
6. Phase 7 → docs, gates, PR

Each step leaves the repo green. Phases 3 and 4 can land as separate PRs if the branch is
getting long; Phases 5 and 6 cannot be usefully split.

### Parallel team strategy

Two developers, after the Foundational checkpoint: A takes Phase 3, B takes Phase 4. They
converge on Phase 5, where the three support files (T042–T044) and the three feature files
(T045–T047) split cleanly again. Phase 6 is one person's work — it is mostly running things
and reading output.

---

## Follow-ups carried forward

T066 and T067 are **deliberately left unchecked and unfiled**. They are real work this
feature uncovered but did not do, and they are recorded here rather than as GitHub issues at
the user's request. Both are also written into the artefacts a future reader would reach for:
F6 and the CALM gap are in `research.md`, the PNG gap is in the features package README, and
the CALM deviation is in `plan.md`'s Complexity Tracking.

Nothing in this feature depends on either.

## Notes

- `[P]` means a different file with no incomplete dependency; everything else is sequential
- **T001 is load-bearing**: without the recorded baseline there is no way to tell an F1-induced list failure from a harness regression, and the information cannot be recovered after T011
- Three tasks exist only because reading the code found blockers, not because the spec asked:
  **T030** (double-offset canvas), **T031/T032** (simulator crash on an array prompt), and the
  bundle-route half of **T011** (the preview loading published bundles). Each is required for a
  scenario to pass — see research.md F1–F3
- **T050** is the constitution principle IV mitigation, not optional polish
- Commit after each task or logical group; run `pnpm biome check --write .` before every commit
- Stop at any checkpoint to validate a story independently
