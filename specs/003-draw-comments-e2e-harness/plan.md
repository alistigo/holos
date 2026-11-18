# Implementation Plan: Draw-Comments End-to-End Features via the Generic Runner

**Branch**: `feat/003-draw-comments-e2e-harness` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-draw-comments-e2e-harness/spec.md`

## Summary

Make `@alistigo/artifact-ai-draw-comments` selectable and runnable in the dev playground,
then convert `@alistigo/artifact-ai-draw-comments-features` from an in-process domain-assertion
suite into a browser-driven features package executed by the generic
`artifact-features-runner-playwright` CLI — the same path `@alistigo/list-features` already
takes. The generic half of `list-features`' support code (browser lifecycle, World, playground
page object, CDN route interception, skip handling, screenshots) moves into the runner and is
published as a second entry point, `@alistigo/artifact-features-runner-playwright/harness`, so
both features packages keep only `.feature` files and domain step definitions.

Reading the code surfaced three blockers that must be fixed for any draw-comments scenario
to pass, and they shape the plan more than the refactoring does:

1. **The built playground loads artifacts from jsDelivr, not the working tree** (research F1).
   `vite preview` sets `import.meta.env.DEV` false, so `resolveScriptUrl` falls through to the
   registry's CDN URL. Today's `artifact-list:test:e2e` is testing the *published* bundle. The
   readiness marker this feature adds to the widget would never be present. Fixed by a harness
   route that serves local `dist/` builds over `cdn.jsdelivr.net/npm/@alistigo/**`.
2. **The preview iframe has no host content, and the drawing canvas is double-offset**
   (F2). The widget prepends into an empty `document.body`, so "host content visible through
   the overlay" has nothing to be visible; and `DrawCanvas` re-applies `region.x/y` inside the
   already-positioned region div, putting the canvas at twice the offset. Fixed by a static
   host surface in the playground entry and by removing the duplicated offset.
3. **The playground's Claude simulator crashes on the widget's prompt** (F3). The widget sends
   an array of content blocks; `ClaudeSimulator` renders it as a React child and throws
   "Objects are not valid as a React child", killing the host page mid-scenario. Fixed by
   normalising a non-string prompt for display.

One further finding is deliberately **not** fixed here: the annotated PNG captures only the
overlay subtree, never the host content behind it (F6). The scenario is converted to assert
the annotation reaches the thread, not pixel content, and the gap is recorded as a follow-up
defect rather than hidden behind a green suite.

## Technical Context

**Language/Version**: TypeScript 5.x, strict (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`); ESM throughout

**Primary Dependencies**: `@cucumber/cucumber` ^12.9, `playwright` ^1.61, `clipanion` 4.0.0-rc.4 (CLI only, must not reach the harness entry point), React 19 + `react-konva` 19 (widget), Vite 7 (playground), `html-to-image` 1.11.13 (new devDependency of the runner, per F4)

**Storage**: none added. The harness seeds the preview origin's `localStorage`; no persisted format changes

**Testing**: Gherkin/Cucumber scenarios driven through Playwright by the runner; `bun test` for the domain unit tests that replace the deleted in-process assertions; Storybook for component review

**Target Platform**: headless Chromium on Linux (CI and local); the runner's existing chromium-resolution precedence is unchanged

**Project Type**: pnpm + Nx monorepo — a CLI package under `cli/`, library packages under `packages/`, the playground app under `apps/`

**Performance Goals**: not a goal of this feature. Keep the draw-comments suite under ~90 s wall clock; runs stay sequential (spec assumption)

**Constraints**: offline and deterministic runs (FR-012) — every CDN fetch the preview makes is route-served locally; `failFast: true` and `not @todo` are unchanged; the harness entry point must not import `clipanion`

**Scale/Scope**: 2 features packages, 1 runner CLI, 1 playground app, 1 widget, 1 registry, 1 shared components package touched. 13 scenarios converted (12 passing, 1 skipped). Roughly 9 generic support files relocated and split

## Constitution Check

*GATE: evaluated before Phase 0, re-evaluated after Phase 1 design.*

| Principle | Verdict | Evidence |
|---|---|---|
| **I. Package-First Architecture** | **PASS** | No new bare directories. The runner becomes publishable and already has `package.json`, `project.json`, `README.md`, `LICENSE`, `version`. Tasks are in `project.json` only (FR-032). The cross-package relative read `../../../../packages/local-storage-plugin/dist/index.js` in `list-features` — a `no-cross-package-relative-import` violation — is **removed** by this feature (research D3), so the gate improves |
| **II. Four-Tier Artifact Platform** | **PASS** | The widget keeps its `widget` type and its Artifact Contract exemption; it already ships `artifact-ai-draw-comments-skill`, the type's one non-negotiable. The new registry entry uses the `@0` major pin (ADR-0011). The readiness marker is a test affordance, not the Artifact Contract — see Complexity Tracking |
| **III. DDD + Event Sourcing + CQRS** | **PASS** | No domain change. The features package *stops* importing the widget's domain layer, which tightens the boundary. The widget's session projection is untouched; the F2b fix is presentation-layer CSS positioning only |
| **IV. TDD via Gherkin + Storybook** | **PASS with a recorded deviation** | Feature files stay the source of truth and the implementation conforms to them (that is what the F2 fixes are). The constitution also expects scenarios to pass at the *Application level* as well as through the Playwright bridge; Q1 → A removes the in-process layer. Deviation recorded and mitigated below. No new components, so no new stories required |
| **V. Architecture as Code (CALM)** | **FAIL — pre-existing, recorded** | The dev-tools tier (runner, features packages) has never been modelled in `@alistigo/architecture`; no `.arch.json` mentions them. Principle V requires new relationships to be declared before implementation. Recorded below with a follow-up rather than silently ignored; `qa:arch-calm` validates existing files and will not fail |

**Engineering standards**: strict TypeScript with no unjustified `any`; Biome before every
commit; `pnpm nx run holos:qa` green before merge; workspace CLI invoked as
`bun ../../cli/.../dist/cli.js` not `pnpm <bin>` (pnpm bin symlinks need `dist/` at install
time, absent in CI); branch created before any change — already done.

**Gate outcome**: proceed. One deviation to justify (IV) and one pre-existing failure to
record (V); neither blocks, and both are in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-draw-comments-e2e-harness/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions D1–D6, findings F1–F6
├── data-model.md        # Phase 1 — harness structures, manifests, state transitions
├── quickstart.md        # Phase 1 — 9 validation steps
├── contracts/
│   ├── harness-api.md       # the new published entry point
│   ├── runner-cli.md        # --artifact, the Local bundle check, Nx targets
│   └── features-package.md  # the MUST / MAY / MUST NOT division of labour
├── checklists/
│   └── requirements.md  # spec quality — 16/16
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
cli/artifact-features-runner-playwright/
├── package.json                      # MODIFIED  drop private, exports ., ./harness, files, publishConfig
├── src/
│   ├── cli.ts                        # unchanged
│   ├── index.ts                      # NEW       the "." entry point
│   ├── commands/
│   │   ├── run.ts                    # MODIFIED  --artifact; harness first in the import list
│   │   └── doctor.ts                 # MODIFIED  Local bundle check
│   ├── harness/                      # NEW       the shared, published harness
│   │   ├── index.ts                  #           value + type exports
│   │   ├── register.ts               #           side-effect module: hooks + setWorldConstructor
│   │   ├── world.ts                  #           ArtifactWorld
│   │   ├── playground.page.ts        #           PlaygroundPage
│   │   ├── routes.ts                 #           bundle/plugin/storage/html-to-image routes
│   │   └── test-ids.ts               #           PLATFORM_TEST_IDS
│   └── lib/                          # unchanged (browsers, check, features-package, playground)

packages/list-features/
├── src/
│   ├── pages/list-application.page.ts  # MODIFIED  extends PlaygroundPage; list interactions only
│   ├── step-definitions/*.steps.ts     # MODIFIED  import World/page types from the harness
│   └── support/
│       ├── world.ts                    # MODIFIED  ListWorld extends ArtifactWorld; setDocument only
│       ├── selectors.ts                # MODIFIED  platform ids removed, list roles kept
│       ├── hooks.ts                    # DELETED   → harness
│       ├── plugin-route.ts             # DELETED   → harness
│       ├── storage-routes.ts           # DELETED   → harness (rewritten, no relative escape)
│       ├── document.ts                 # unchanged (list fixtures)
│       └── fixtures/                   # unchanged (fake sentry plugin)

packages/artifact-ai-draw-comments-features/
├── package.json                      # MODIFIED  type features + domain, exports, files, deps
├── project.json                      # MODIFIED  @nx/js:tsc build; test target removed
├── cucumber.json                     # DELETED
├── features/*.feature                # MODIFIED  3 files, steps reworded to observable outcomes
└── src/                              # NEW       (was step-definitions/ at the package root)
    ├── index.ts                      #           FEATURES_DIR / STEP_DEFINITIONS_DIR / SUPPORT_DIR
    ├── step-definitions/*.steps.ts    #           rewritten: UI interactions, not domain assertions
    └── support/
        ├── world.ts                  #           DrawCommentsWorld extends ArtifactWorld
        ├── draw-comments.page.ts     #           extends PlaygroundPage: drag, draw, send
        └── selectors.ts              #           widget roles and accessible names

packages/artifact-ai-draw-comments/
├── src/App.tsx                       # MODIFIED  data-testid="alistigo-app"; root position: relative
├── src/components/DrawCanvas.tsx     # MODIFIED  remove the duplicated region offset (F2b)
├── src/domain/session.test.ts        # NEW       domain assertions ported from the deleted steps
└── project.json                      # MODIFIED  test target (bun test)

packages/artifact-manager/
└── src/registry.ts                   # MODIFIED  append the draw-comments entry

apps/alistigo-artifact-playground/
├── package.json                      # MODIFIED  workspace dependency on the widget
├── vite.config.ts                    # MODIFIED  source alias for the widget
├── src/artifact-entry.tsx            # MODIFIED  import branch + the static host surface
├── src/components/ClaudeSimulator.tsx            # MODIFIED  render a normalised prompt (F3)
└── src/hooks/useClaudeCompleteSimulator.ts       # MODIFIED  accept a non-string prompt (F3)
```

**Structure Decision**: no new packages. The harness lands inside the existing runner CLI
package under `src/harness/`, exposed as the `./harness` export — the user's explicit
instruction ("that code duplicate should then live directly inside the runner"), and the
route the user chose in Q2 → B. The draw-comments features package gains a `src/` directory
so it can compile with `@nx/js:tsc` exactly as `list-features` does; its step definitions
currently sit at the package root, uncompiled, which the runner cannot load.

## Phasing

The order is forced by the blockers: nothing can be verified until the widget actually runs
in the playground and the harness exists.

| Phase | Delivers | Verified by |
|---|---|---|
| **A. Baseline** | list suite pass count recorded | quickstart step 1 |
| **B. Harness extraction** | `src/harness/`, runner publishable, `list-features` consuming it, list suite green | quickstart steps 2, 6, 7 |
| **C. Playground integration** | registry entry, dependency, alias, entry branch, host surface, F3 simulator fix, readiness marker, F2b canvas fix | quickstart step 3 |
| **D. Bundle route** | local `dist/` served over jsDelivr, `doctor`'s Local bundle check, `--artifact` on `run` | quickstart step 4 |
| **E. Features conversion** | package metadata, `src/` layout, 13 scenarios reworded and rewritten, domain unit tests | quickstart step 5 |
| **F. Targets and docs** | the three Nx targets, runner README, features README (incl. the F6 gap) | quickstart steps 5, 8 |
| **G. Gates** | Biome, `holos:qa`, pack dry runs | quickstart step 8 |

Phase B must leave the list suite green before Phase C starts — it is the only point where a
harness regression is cheap to find.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| **Principle IV** — the Application-level (in-process) Gherkin layer is dropped for draw-comments; only the Playwright bridge remains | The user chose Q1 → A: all 13 scenarios become browser-driven, and FR-023 removes the package's own Cucumber profile so the runner is the single execution path. `list-features` already runs only through the bridge, so this aligns the two packages rather than diverging them | Keeping a second non-browser Cucumber profile (Q1 → C) was offered and declined: it leaves two ways to run the same scenarios and contradicts FR-023. **Mitigation**: the domain assertions in the three deleted step files (`projectSession` status transitions, `canSend`, snapshot presence) are ported to `packages/artifact-ai-draw-comments/src/domain/session.test.ts` as `bun test` cases, so the domain-level coverage principle IV asks for survives — as unit tests rather than as Gherkin |
| **Principle V** — the dev-tools tier is not in the CALM model, so the new relationships (features package → runner harness, playground → widget, runner → publishable) are not declared before implementation | Pre-existing: feature 002 introduced `artifact-features-runner-playwright` and the `features` package type without a CALM entry, and no `.arch.json` in `@alistigo/architecture` mentions either. Modelling the whole dev-tools tier is a feature in its own right, not a side effect of this refactor | Declaring only this feature's three relationships in isolation would produce a CALM fragment describing a tier whose other nodes do not exist, which is worse than an honest gap. **Follow-up**: model the dev-tools tier (playground, runner, features packages, skill tester) in `@alistigo/architecture` as its own spec. `qa:arch-calm` validates the files that exist and will not fail on this |
| **A `widget`-type package gains the `alistigo-app` readiness marker**, a detail otherwise associated with the Artifact Contract it is exempt from | Chosen by the user (Q3 → A). Without one readiness contract the harness needs per-domain configuration (Q3 → B) or an unreliable "body is non-empty" probe (Q3 → C) | Not a real violation, recorded for visibility: the marker is a `data-testid` the harness waits on, carrying none of the Artifact Contract's obligations (lifecycle phases, loading and error screens, badge, config/state documents). The exemption is untouched |
| **Changing what `artifact-list:test:e2e` tests** — from the published jsDelivr bundle to the local build (F1) | Unavoidable. The feature adds a readiness marker to the widget's source; if the preview keeps loading published bundles, every draw-comments scenario hangs. Serving local builds is also what FR-012's offline/deterministic promise requires | Special-casing the route to the draw-comments bundle only would leave `artifact-list` testing a published artifact — a pre-merge gate that cannot catch a local regression. **Risk accepted and instrumented**: quickstart steps 1 and 6 bracket the change with a recorded pass count, so a previously masked list regression is attributed correctly rather than blamed on the harness move |

## Post-Design Constitution Re-Check

Re-evaluated against the Phase 1 artifacts:

| Principle | Verdict | Change from the pre-Phase-0 check |
|---|---|---|
| I. Package-First | **PASS** | Strengthened — the harness contract (`contracts/harness-api.md`) forbids the relative escape, and `features-package.md` lists it as MUST NOT |
| II. Four-Tier | **PASS** | Unchanged. `data-model.md` §6 pins the `@0` CDN pin and `availablePlugins: []` |
| III. DDD | **PASS** | Strengthened — the features package drops its `dependencies` edge on the widget entirely |
| IV. TDD | **PASS with deviation** | Mitigation is now concrete: `session.test.ts` is in the structure above and in Phase E |
| V. CALM | **FAIL, recorded** | Unchanged; follow-up named |

No new violations introduced by the design. The two recorded items are unchanged in nature
and both carry a stated mitigation or follow-up, so the gate passes for implementation.
