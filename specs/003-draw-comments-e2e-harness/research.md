# Phase 0 Research: Draw-Comments End-to-End Features via the Generic Runner

**Feature**: `specs/003-draw-comments-e2e-harness` | **Date**: 2026-11-17

All three spec clarifications were resolved by the user during `/speckit-specify`
(**Q1: A**, **Q2: B**, **Q3: A**). This document records the design decisions that follow
from them, plus six findings uncovered while reading the existing code that materially
change the work. Findings F1–F3 are blockers: without them no draw-comments scenario can
pass.

---

## Part 1 — Decisions following from the resolved clarifications

### D1. The harness ships as a second entry point of a now-publishable runner

**Decision**: `@alistigo/artifact-features-runner-playwright` drops `"private": true` and
exposes two entry points: `.` (unchanged CLI behaviour, still the `bin`) and `./harness`
(the shared World, playground page object, route helpers, and their types). Features
packages add it as a `devDependency` and import from `@alistigo/artifact-features-runner-playwright/harness`.

**Rationale**: Chosen by the user (Q2 → B). It makes the dependency edge honest and
type-checkable: a features package's step definitions declare exactly what they consume,
and `tsc` verifies it. A features package stays publishable because the dependency is on a
published package.

**What this obliges**: the runner gains the Package-First publishable surface — `version`
is already `0.1.0`, `README.md` and `LICENSE` already exist, so what is missing is an
`exports` map, `files`, `publishConfig`, repository/author metadata, and removal of
`"private": true`. `nx.json`'s release config already covers `cli/*` with independent
versioning, so no release wiring is needed.

**Alternatives rejected**: run-time injection with type-only imports (Q2 → A) keeps the
runner private but makes the harness an undeclared, unversioned contract; a third
`@alistigo/artifact-features-harness` package (Q2 → C) layers best but is not "inside the
runner" as asked.

### D2. The harness registers before the features package, in one module instance

**Decision**: the runner prepends its harness registration module to Cucumber's `import`
list, ahead of the target package's `stepDefinitionsDir` and `supportDir`:

```text
import: [ <harness registration>, <stepDefinitions>/**/*.js, <support>/**/*.js ]
```

**Rationale**: `setWorldConstructor` is last-call-wins. The harness must register the base
World first so a features package that subclasses it (D3) can override afterwards. Ordering
also puts `BeforeAll` browser launch ahead of any domain hook.

**Risk and mitigation**: the harness is loaded twice by two different specifiers — by the
runner as an absolute path, and by a features package as a bare specifier. Node's ESM loader
keys the module cache on the resolved file URL and resolves symlinks by default, so the pnpm
symlink and the absolute path land on the same realpath and the same module instance. The
quickstart includes an explicit check for this (one browser launched, one World constructor
registered); if it ever breaks, the fallback is for the runner to import the harness through
the same bare specifier it hands Cucumber.

### D3. Domain state and domain page objects extend the harness, they do not replace it

**Decision**: the harness exports `ArtifactWorld` (base) and `PlaygroundPage` (base). A
features package that needs domain state subclasses `ArtifactWorld` and calls
`setWorldConstructor` with the subclass; a features package that needs domain interactions
subclasses `PlaygroundPage`.

**Rationale**: FR-015 requires extension without re-declaring the lifecycle. Subclassing
gives it with no new mechanism, and `exactOptionalPropertyTypes`-safe typing.

**Consequence — the generic/domain split is not where it looks**: two things currently in
`list-features/src/support/` are **list-specific** despite living next to generic code, and
must not move into the harness:

| Current file | Verdict | Why |
|---|---|---|
| `support/hooks.ts` | → harness | pure lifecycle |
| `support/world.ts` | → harness, minus `setDocument` | `setDocument(document: AlistigoDocument)` is typed to `@alistigo/list-document` |
| `support/plugin-route.ts` | → harness | generic; already resolves CDN URLs by package name |
| `support/storage-routes.ts` | → harness, rewritten | see F3; its `../../../../packages/...` read is a cross-package relative path the constitution forbids |
| `pages/application.page.ts` | **split** | `open`/`waitForArtifactReady`/`reload`/frame access → harness; `addElement`, `deleteElement`, `checkElement`, `setPseudo`, `getListItems` → stay |
| `support/selectors.ts` | **split** | `app`, `actionPending` are the platform contract → harness; `addInput`, `rowDelete`, `userMenu`, … → stay |
| `support/document.ts` | stays | list JSON-LD fixtures |
| `support/fixtures/` | stays | fake Sentry plugin for list plugin scenarios |
| `src/tags.ts` | stays | list tag taxonomy |

The harness therefore offers **generic storage seeding** — `seedStorage(entries)` writing
`localStorage` keys and reloading — and `list-features` keeps a thin
`setDocument(doc)` that calls it with `{ document: JSON.stringify(doc) }`.

### D4. The readiness marker goes on the widget's own root

**Decision**: the widget's `App` root (`div.ai-draw-comments`) gains
`data-testid="alistigo-app"`, the same marker `AlistigoApp` from
`@alistigo/list-components-react` already renders.

**Rationale**: Chosen by the user (Q3 → A). The harness then has exactly one readiness
contract and needs no per-domain configuration. The marker is a test affordance, not the
Artifact Contract, so the `widget` exemption in the constitution is untouched.

**Alternatives rejected**: a per-package readiness selector (Q3 → B) adds a configuration
point every new features package must remember; the generic "iframe body has non-script
children" probe (Q3 → C) reports ready before React has mounted and would be flaky.

### D5. Scenario conversion: all 13 retained, assertions moved to what the UI shows

**Decision** (Q1 → A). The widget's existing UI already exposes an observable for every
assertion, with one exception. Mapping:

| Feature / scenario | Observable outcome in the playground |
|---|---|
| **draw-comment-send** 1 — button visible on load | `getByRole("button", { name: "Draw Comment" })` visible |
| 2 — crosshair selection mode | the selection overlay (`role=presentation`, name "Drag to select annotation area") is attached and carries `cursor-crosshair` |
| 3 — drag shows selection indicator | after `mouse.down/move`, the preview rectangle is attached with the dragged width/height |
| 4 — canvas + toolbar after confirm | a `canvas` is attached inside the region, and the toolbar's "Rectangle"/"Line" buttons are visible |
| 5 — drawing a rectangle | **the Send button becomes enabled** — `CommentInput` computes `sendable = shapes.length > 0 \|\| comment.trim()`, so an enabled Send is the widget's own proof a shape landed; the host content behind stays visible (F2) |
| 6 — Send generates PNG and transmits | the thread's `img[alt="Annotated region"]` appears with a non-empty `data:image/png;base64,…` `src`, and the simulator's response text renders below it |
| 7 — cancel in selection overlay | overlay detached; "Draw Comment" button enabled again |
| 8 — cancel in drawing panel | canvas and toolbar detached; "Draw Comment" button enabled again |
| **claude-response** 1 — response appears, no reload | response paragraph visible; a page-load counter stamped on `window` survives, proving no reload |
| 2 — PNG and comment stay above the response | `img[alt="Annotated region"]` and the comment paragraph still visible alongside the response |
| 3 — button re-activates after response | `getByRole("button", { name: "Draw Comment" })` is enabled |
| **embed-host** 1 — `@jsdom-required` script-tag mount | retagged `@todo` → skipped by the runner's existing `not @todo` filter (FR-027) |
| 2 — annotated PNG captures host content | the thread image is present and non-empty **and** the host surface behind the overlay was visible during the session (F2); pixel content is not asserted — see F6 |

**Note on scenario `claude-response` 1**: the widget never shows a "sent, awaiting response"
state in practice — `doSend` awaits both the snapshot and the Claude response, then
dispatches `AnnotationSent` and `ClaudeResponded` together. `AnnotationThread`'s
"Claude is thinking…" branch is therefore unreachable through the UI. The scenario asserts
the end state (response rendered under the annotation) rather than the intermediate one.

### D6. The old in-process Cucumber setup is removed wholesale

**Decision**: delete `cucumber.json`, the `test` target in `project.json`, and the three
existing `step-definitions/*.steps.ts` (rewritten, not edited — every step changes from a
domain assertion to a UI interaction). The package's `dependencies` entry on
`@alistigo/artifact-ai-draw-comments` goes away: after conversion the features package has
no reason to import the widget's domain layer. It gains `devDependencies` on the runner and
`playwright`, and `peerDependencies` matching `list-features`.

Metadata changes: `alistigo.type` `"application"` → `"features"`, plus
`alistigo.domain: "artifact-ai-draw-comments"` — the unscoped name minus `-features`, which
is what `features/domain-consistent` in `artifact-arch-check` compares against. No rename.

Build: adopt `list-features`' `@nx/js:tsc` target emitting to `dist/`, with `files` listing
`dist` and `features`, and `exports` for `.`.

---

## Part 2 — Findings from the code that change the work

### F1 (blocker). The built playground loads artifacts from jsDelivr, not from local source

**Finding**: `HostPage.tsx`'s `resolveScriptUrl` only honours the `dev` and `prod-local`
modes when `import.meta.env.DEV`. The end-to-end target runs `vite preview` — a production
build — so `import.meta.env.DEV` is `false` and the script URL falls back to
`ARTIFACT_REGISTRY[app].cdnUrl`, a jsDelivr URL. Today's `artifact-list:test:e2e` is
therefore asserting against the **published** `@alistigo/artifact-list@0`, not the working
tree.

**Why it blocks this feature**: D4 adds the readiness marker to the widget's source. If the
preview loads the published bundle, the marker is absent and every scenario hangs on
`waitForArtifactReady`. The same applies to the fixes in F2.

**Decision**: the harness installs an **artifact bundle route**: a single
`page.route("https://cdn.jsdelivr.net/npm/@alistigo/**", …)` handler that maps the requested
URL back to a package name, resolves that package in the workspace, and fulfils the request
with its local `dist/` build — falling through to the network when no local build exists.
This subsumes the existing per-plugin `installPluginRoute` calls under one rule and makes
runs offline and deterministic, which is what FR-012 asks for.

**Side effect, called out deliberately**: this changes what `artifact-list:test:e2e`
exercises — from the published bundle to the local build. That is the correct behaviour for
a pre-merge gate, but it is a behavioural change to an existing target, and FR-033 promises
"no change in observable behaviour" for it. The honest reading: the *interface* is unchanged
(same command, same pass/fail reporting) while the *subject* becomes the working tree. The
risk is that a local regression in `artifact-list` that the published bundle was masking now
surfaces as a list-scenario failure. Verify before and after (quickstart step 6).

### F2 (blocker). The preview iframe has no host content, and the canvas is double-offset

Two separate problems with the same cause — nobody has run this widget in the playground.

**F2a — no host content**: `auto-mount` prepends the widget into the preview iframe's
`document.body`, which is otherwise empty. `embed-host`'s "host artifact content" and
`draw-comment-send` 5's "underlying artifact content remains fully visible" have nothing to
be visible. The widget's own `demo/index.html` renders a `.demo-content` panel for exactly
this reason.

**Decision**: the playground's `artifact-entry.tsx` renders a small static host surface
before mounting the widget for this artifact — a heading and two paragraphs, modelled on
`demo/index.html`, carrying a stable `data-testid` so scenarios can assert it stays visible.
This is what makes the widget's embedded nature testable at all.

**F2b — the drawing canvas is positioned at twice the region offset**: `App`'s `regionRef`
div is `position: absolute` with `left: region.x; top: region.y`, and `DrawCanvas` renders
*another* `position: absolute` div with `left: region.x; top: region.y` **inside** it. The
inner offset is relative to the now-positioned outer div, so the canvas lands at
`2 × region`. The widget root is not `position: relative`, so the outer div resolves against
the initial containing block.

**Decision**: remove the duplicated offset from `DrawCanvas` (the inner wrapper becomes
`inset-0` within the already-positioned region div), and give the widget root
`position: relative` so the region div anchors predictably. Scenario 4 ("a transparent
drawing canvas overlay appears **on top of the selected region**") is the test that catches
this: the canvas's bounding box must intersect the selected region.

**Why it is in scope**: the spec's own success criterion SC-003 requires 12 scenarios to
pass. They cannot pass against this layout. Under constitution principle IV the feature file
is the source of truth and the implementation conforms, so this is a conformance fix, not
opportunistic refactoring.

### F3 (blocker). The playground's Claude simulator crashes on the widget's prompt

**Finding**: the widget calls `window.claude.complete([{type:"image",…},{type:"text",…}])`
— an array of content blocks. The bridge forwards `prompt` verbatim.
`useClaudeCompleteSimulator` stores it as `prompt: string`, and `ClaudeSimulator.tsx` renders
`{entry.prompt}` and `title={entry.prompt}`. Rendering an array of plain objects throws
"Objects are not valid as a React child", taking down the host page — not the iframe — in
the middle of every send scenario.

**Decision**: normalise the prompt where it enters the simulator. A non-string prompt is
summarised for display (e.g. `image + "Look at this area"`), with the raw value kept for the
log entry. The simulator's response path is unaffected: it posts
`{ type: "claudeComplete", id, completion }` regardless of prompt shape.

### F4. `html-to-image` is a network dependency of every send scenario

**Finding**: `buildAnnotatedSnapshot` calls `window.htmlToImage.toPng`. The playground
injects that library from `cdnjs.cloudflare.com` in the iframe head, and only when
`aiContext === "claude"`. It is not installed in the workspace.

**Decision (revised during implementation — the fallback was taken)**: the request is **not**
intercepted. cdnjs serves the *minified* build under an `integrity` hash and npm ships only
the unminified `dist/html-to-image.js`, whose SHA-512 does not match. Substituting it makes
the browser reject the script outright, and the only alternative — dropping `integrity` from
the srcdoc — would weaken the real playground for every user to suit the tests.

So `html-to-image` stays the one external dependency of a run: scenarios that send an
annotation reach cdnjs, everything else is served locally. The `devDependency` added in T002
was removed again, since nothing uses it. FR-012's offline promise therefore holds for every
`@alistigo/*` bundle but not for this one library.

### F5. The artifact to select must be told to the runner

**Finding**: `list-features`' World never selects an artifact — it navigates to the
playground and waits for `alistigo-app`, relying on `KNOWN_APPS[0]` (insertion order of
`ARTIFACT_REGISTRY`, currently `@alistigo/artifact-list`) being the default. The `run`
command has no `--artifact` flag; only `doctor` does.

**Decision**: add `--artifact` to `run`, mirroring `doctor`, passed to the harness through
the environment. `PlaygroundPage.open()` selects it when set and otherwise keeps today's
behaviour. The draw-comments targets pass
`--artifact=@alistigo/artifact-ai-draw-comments`; the list targets omit it, so FR-033 holds.
Registering draw-comments by **appending** to `ARTIFACT_REGISTRY` also keeps
`KNOWN_APPS[0]` pointing at the list artifact.

This avoids extending the features-package contract with an `alistigo.artifact` field, which
the spec's assumptions rule out.

### F6. The annotated PNG does not actually capture host content

**Finding**: `buildAnnotatedSnapshot` captures `regionEl` — the wrapper div that contains
only the Konva canvas. Nothing of the host page behind the region is in that subtree, so the
composite PNG is the drawn shapes on a transparent background. `embed-host`'s "the annotated
PNG captures the host artifact content visible through the transparent overlay" does not hold
at the pixel level, independently of F2.

**Decision**: **do not fix it in this feature.** Per D5 the scenario asserts that the
annotation image reaches the thread and that the host surface was visible during the session;
it does not assert pixel content, which no reasonable Gherkin step should. Fixing the capture
means changing what the widget screenshots (the host region rather than the overlay) — a
behavioural change to the widget's output, outside a refactoring feature, and deserving its
own spec. **Recorded as a follow-up defect to raise after this feature merges**, and noted
in the features package README so the gap is visible rather than implied by a green suite.

### F7 (blocker, found during implementation). `react-konva` hard-requires a React minor the workspace does not have

**Finding**: the widget declared `"react-konva": "^19.0.0"`, which resolved to `19.3.2`.
That version throws at mount — *"react-konva requires React 19.3 or later within React 19"* —
while the workspace is on React 19.2.5. The widget could not mount **anywhere**: not in the
playground, not in a scenario. It had never shown up because the widget had no playground
entry, no e2e target, and a `demo` target nobody runs.

**Decision**: pin to `~19.2.7`, the top of the line that matches React 19.2, as the error
message itself advises. Upgrading React across the monorepo instead would touch the list
artifact, every components package and the playground — far outside this feature.

### F8 (blocker, found during implementation). The widget's Lingui catalog was empty

**Finding**: `src/locales/en/messages.po` contained only its header. With no catalog entries
Lingui falls back to the generated message id, so every `aria-label` rendered as a hash —
`aria-label="TzVdRJ"` instead of `"Draw Comment"`. Every role-and-name locator in FR-028
would have been unusable.

**Decision**: run `lingui extract` (21 messages) and add `i18n:extract` / `i18n:extract:clean`
targets to the widget's `project.json`, so the catalog is reproducible rather than a one-off.

### F9 (found during implementation). `@todo` cannot be reported as skipped yet

**Finding**: FR-027 asked for the `@todo` scenario to be "skipped visibly". The harness has a
`Before({ tags: "@todo" })` hook that marks scenarios skipped, which would do exactly that —
but Cucumber resolves step definitions **before** hooks run. `list-features`' `@todo` posthog
feature has no step definitions at all, so removing the config-level `tags: "not @todo"` filter
reported 3 scenarios `undefined` and `failFast` aborted that suite at 4 passed instead of 21.
This was measured, not predicted: the filter was removed, both suites run, and the list
regression was observed directly.

**Decision**: keep the filter. The draw-comments suite reports `12 scenarios (12 passed)` and
the thirteenth is excluded by tag rather than printed as skipped. FR-027's reporting nicety is
not met; FR-033's no-list-regression constraint is. Making it meet both requires writing
`list-features`' missing posthog step definitions, which is its own piece of work. Recorded in
both packages' READMEs so the thirteenth scenario is not silently forgotten.

### F10 (found during implementation). The host surface belongs in the srcdoc, not the dev entry

**Finding**: the host content was first added to the playground's `artifact-entry.tsx`, which
is the correct place in dev — and never runs in a preview build, where the iframe is pointed
straight at the artifact's registry URL. The surface was simply absent in exactly the mode the
e2e target uses.

**Decision**: inject it from `buildIframeSrcdoc.ts`, which the host page builds in both modes.
Kept as plain HTML in the srcdoc rather than a React component, so ADR-0012's
story-per-component rule is not triggered by test scaffolding.

---

## Part 3 — Mechanics confirmed by reading the code

| Question | Answer |
|---|---|
| Does the runner's features-package contract need changing? | No. `alistigo.type`/`domain` + `FEATURES_DIR`/`STEP_DEFINITIONS_DIR`/`SUPPORT_DIR` already fit. |
| Does `artifact-arch-check` need changing? | No. `features/naming-convention`, `domain-required`, `domain-consistent`, `domain-unique` all pass with `domain: "artifact-ai-draw-comments"`. |
| How is the widget bundled? | UMD, `dist/index.umd.js`, same shape as `artifact-claude-capabilities-demo`, which the playground already loads via `await import(...)`. |
| Does the playground need a Vite alias? | Yes — `@alistigo/artifact-ai-draw-comments` → `src/index.tsx`, so dev mode serves source, matching the two existing artifacts. |
| Does the widget need plugins declared? | No. `availablePlugins: []`, like the capabilities demo. The harness's storage/plugin routes are harmless no-ops for it. |
| Is the widget's skill package present? | Yes, `packages/artifact-ai-draw-comments-skill` — the `widget` type's one non-negotiable is met. |
| Can Playwright drive the Konva stage? | Yes. `SelectionOverlay` uses React `onMouseDown/Move/Up` with `clientX/Y`; the stage uses Konva's own mouse events on its `<canvas>`. `page.mouse.move/down/up` drives both. The overlay enforces a 20×20 px minimum region. |
| Default simulator delay? | `0 ms`, with an error mode toggle. Scenarios must still await the response element rather than assume synchrony (FR-029). |
| Is a locale concern involved? | Scenarios run against the `en` build; accessible names come from Lingui `t` macros already present on every control. |

---

## Open risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| The harness is loaded as two module instances, double-launching the browser | Low | Verified by quickstart step 2; fallback in D2 |
| Serving local builds over jsDelivr (F1) surfaces a pre-existing `artifact-list` regression | Medium | Record the list suite's pass count before the change (quickstart step 1) and compare after |
| Konva drag coordinates prove flaky in headless Chromium | Medium | Assert the widget's own derived state (Send enabled, canvas attached) rather than pixel geometry; the overlay's 20×20 minimum means regions must be comfortably larger |
| `html-to-image` version cannot be matched to the integrity hash | Low | Fall back to the network request, documented |
| The dev-tools tier is absent from the CALM model | Certain | Pre-existing since feature 002; recorded in the plan's Complexity Tracking as a deviation with a follow-up, not silently ignored |
