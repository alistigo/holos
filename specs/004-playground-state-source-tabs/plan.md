# Implementation Plan: Playground State Persistence & Source Tabs

**Branch**: `feat/004-playground-state-source-tabs` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-playground-state-source-tabs/spec.md`

## Summary

Three changes to `apps/alistigo-artifact-playground`, all inside the existing app, with no new
workspace package and no new runtime dependency:

1. **Form persistence** — the left panel's `Config` state (the single `Config` object already
   held by `useHostConfig`) is written to `localStorage` on change and restored, field by field
   and validated, on load.
2. **Address parameters** — `?artifact=` and `?source=` are read once at startup and override
   the restored state for those two fields only.
3. **Segmented preview source** — `buildIframeSrcdoc` is refactored from "one template string"
   into "an ordered list of tagged parts". The whole document is the parts joined; each new tab
   is one segment's parts joined. That makes "Source is the merge of the other tabs" true by
   construction rather than by inspection, and keeps the assembled output byte-identical to
   today's, which is what protects the end-to-end suites.

The technical core is three pure modules (`playground-state`, `playground-url`, the segmented
`buildIframeSrcdoc`) covered by `bun test`, plus thin React wiring. Purity is a hard design
constraint here, not a preference: the app has no DOM-capable test runner, so any logic that
needs testing has to be reachable without a browser and without Vite's `?raw` / `?url` imports.

## Technical Context

**Language/Version**: TypeScript 5.x, strict (`strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`); React 19.2

**Primary Dependencies**: React 19 + Vite 7 (app shell), Tailwind CSS v4 (styling),
`prism-react-renderer` (already present — the syntax colouring the new tabs reuse),
`@uiw/react-json-view` (existing Config tab), `@alistigo/artifact-manager` (artifact registry,
the source of valid artifact names), `@alistigo/claude-artifact-api` (the bridge HTML the AI
Bridge tab displays). **No new dependency is added.**

**Storage**: browser `localStorage`, one key, holding a versioned JSON envelope. The key must
not begin with `alistigo` — `useLocalStorageEntries` lists keys by `startsWith("alistigo")` and
presents them as artifact storage (FR-006).

**Testing**: `bun test` with co-located `*.test.ts` (the repo-wide convention; the app has no
test target today and gains one), Storybook stories for every touched component (ADR-0012),
and the existing Cucumber + Playwright suites (`packages/list-features`,
`packages/artifact-ai-draw-comments-features`) run unchanged as the regression guard for
FR-019.

**Target Platform**: modern evergreen browsers; the playground runs under `vite` in development
and `vite preview` / GitHub Pages as a static build.

**Project Type**: single-page Vite application inside the Nx monorepo (Tier 4 — Dev Tools).

**Performance Goals**: persistence must not make the form feel slow — one serialise + one
`setItem` per committed change, no change to srcdoc rebuild cost; the preview's rebuild stays
on the existing `useMemo` over `config`.

**Constraints**:
- The assembled srcdoc MUST stay byte-identical to today's output (e2e safety; asserted by test).
- No plain CSS and no inline `style` props in new code (constitution, UI Stack) — Tailwind only.
- No `console.*` in app code; no `any` without a same-line justification.
- Every new/changed component under `src/components/` needs a co-located `.stories.tsx`
  (`qa:stories-check` enforces it).
- Logic under test must not import Vite-only module queries (`?raw`, `?url`) or
  `import.meta.env`, because `bun test` cannot resolve them.

**Scale/Scope**: one app; ~6 files changed, ~5 added; the preview panel goes from 4 tabs to 7.

## Glossary

The spec is written for a reader who does not have the code open, so several things carry two
names. This table is the mapping; it is not a rename proposal — both registers stay.

| Spec / stakeholder term | Plan, tasks and code |
|---|---|
| "artifact source" (FR-002, FR-008) | the *Source* select in the Playground config section → `Config.mode` → the `PlaygroundMode` union (`"dev" \| "prod-local"`) |
| "address parameter" (FR-007…FR-011) | URL query parameter — `?artifact=`, `?source=` — parsed by `playground-url.ts` |
| "view" (FR-012…FR-018) | tab, in `ArtifactViewPanel`'s `Tab` union |
| "part" of the injected page (FR-017, FR-023) | `SrcdocSegment` / `SrcdocPart` in `buildIframeSrcdoc.ts` |
| "saved setup" / "saved configuration" (FR-001…FR-006) | the `PersistedPlaygroundState` envelope under `dev-playground:config:v1` |
| "the left form" (FR-001) | `HostForm`'s Config tab — its three sections, not the Claude Simulator tab |

One more that is easy to trip on: *artifact* means a package in `ARTIFACT_REGISTRY`
(`@alistigo/artifact-list`), never a claude.ai artifact and never the preview iframe.

## Constitution Check

*GATE: evaluated before Phase 0 and re-evaluated after Phase 1 design.*

| Principle | Verdict | Reasoning |
|-----------|---------|-----------|
| **I. Package-First Architecture** | PASS | No new repository unit. The three new modules are app-internal, single-consumer files inside an existing package (`apps/alistigo-artifact-playground`), not a new directory at the repo root. ADR-0028 governs repository units, not modules within one. |
| **II. Four-Tier Platform** | PASS | The playground is Tier 4 (Dev Tools). It is not an `@alistigo` artifact, so the Artifact Contract, the published/draft overlay and the skill-package requirement do not apply. Nothing here touches Tier 1–3 packages; `@alistigo/claude-artifact-api` and `@alistigo/artifact-manager` stay consumed via `workspace:*`, unchanged. |
| **III. DDD + Event Sourcing** | N/A | No artifact domain logic, no document, no event log. The persisted object is dev-tool UI state, not an Alistigo document, so JSON-LD, TypeID and the projector requirements do not apply to it. |
| **IV. TDD via Gherkin + Storybook** | PASS with justified deviation | Tests precede implementation: each pure module's `*.test.ts` is written before its implementation (see `tasks.md` ordering), and every touched component keeps a co-located story. The deviation is that no new `.feature` file is written — see **Complexity Tracking**. |
| **V. Architecture as Code (CALM)** | PASS | No new package, no new relationship, no boundary change, so no `.arch.json` element to declare ahead of implementation. `qa:arch-check` rules are unaffected: no cross-package relative import is introduced and no new dependency edge is created. |
| **Engineering Standards** | PASS | Strict TS; Tailwind-only styling; `bun test` as the runner, matching every other package; Biome run before each commit; new `test` target defined in `project.json`, not in `package.json` scripts. |
| **Quality Gates** | PASS | `qa:lint`, `qa:arch-check`, `qa:arch-calm`, `qa:dead-code`, `qa:audit`, `qa:stories-check`, `qa:artifact-arch-check`, `qa:artifact-sandbox-check` all expected to pass; `qa:stories-check` is the one that constrains the design (stories for touched components). Fallow complexity is a live risk in `ArtifactViewPanel`, addressed by the data-driven tab table in Phase 1 rather than by adding another ignore comment. |
| **Git Discipline** | PASS | Work proceeds on `feat/004-playground-state-source-tabs`, already created; conventional commits; no direct commit to `main`. |

**Gate result: PASS.** One deviation, recorded and justified below.

## Project Structure

### Documentation (this feature)

```text
specs/004-playground-state-source-tabs/
├── plan.md              # This file
├── research.md           # Phase 0 — decisions and rejected alternatives
├── data-model.md         # Phase 1 — persisted state, URL overrides, segment model
├── quickstart.md         # Phase 1 — how to validate the feature end to end
├── contracts/
│   ├── playground-state.md    # Persisted-state module contract + storage key
│   ├── url-parameters.md      # Address-parameter contract
│   └── srcdoc-segments.md     # Segment model + merge invariant
├── checklists/
│   └── requirements.md   # Spec quality checklist (from /speckit-specify)
└── tasks.md              # Phase 2 — created by /speckit-tasks, not here
```

### Source Code (repository root)

```text
apps/alistigo-artifact-playground/
├── src/
│   ├── playground-config.ts       # NEW — Config, PlaygroundMode, PlaygroundCatalog; imports nothing
│   ├── playground-state.ts        # NEW — pure: serialise / parse / sanitise persisted Config
│   ├── playground-state.test.ts   # NEW — bun test
│   ├── playground-url.ts          # NEW — pure: read ?artifact= and ?source= overrides
│   ├── playground-url.test.ts     # NEW — bun test
│   ├── srcdoc-assets.ts           # NEW — the Vite-only imports (?raw / ?url) and CSP, isolated
│   ├── buildIframeSrcdoc.ts       # CHANGED — now part-based; same public output
│   ├── buildIframeSrcdoc.test.ts  # NEW — bun test: merge invariant + byte-identical output
│   ├── constants.ts               # CHANGED — expose the catalog the pure modules validate against
│   ├── hooks/
│   │   └── useHostConfig.ts       # CHANGED — defaults ◁ stored ◁ URL, and persist on change
│   └── components/
│       ├── SourceView.tsx         # CHANGED — reusable: code + label + empty message
│       ├── SourceView.stories.tsx # CHANGED — stories for the new props
│       ├── ArtifactViewPanel.tsx  # CHANGED — 7 tabs from a data-driven table
│       └── ArtifactViewPanel.stories.tsx # CHANGED — stories for the new tabs
└── project.json                   # CHANGED — `test` target runs bun test (+ the fixture validator)

cli/artifact-features-runner-playwright/
└── src/harness/world.ts           # CHANGED — doc comment only: the "no storage" premise is now false
```

**Structure Decision**: everything lands inside the existing `apps/alistigo-artifact-playground`
package, with one documentation-only touch to the shared harness. `playground-config.ts` exists to
keep the import graph acyclic: `Config` currently lives in `hooks/useHostConfig.ts`, and that hook
now imports `playground-state.ts`, which types its own signatures with `Config` — a cycle that
`qa:arch-check` rejects outright, because `.dependency-cruiser.cjs` sets `tsPreCompilationDeps: true`
(type-only imports count) with `no-circular` at `severity: "error"`. The types move to a module that
imports nothing; `useHostConfig` re-exports them so existing importers are unaffected. The split inside `src/` is
driven by testability rather than by taste: `playground-state.ts`, `playground-url.ts` and
`buildIframeSrcdoc.ts` must stay importable from `bun test`, so all Vite-resolved imports
(`@alistigo/claude-artifact-api/inject-script.html?raw`, `html-to-image/...?url`) and all
`import.meta.env` reads move out into `srcdoc-assets.ts`, which the React layer passes in. No
pure module reads `localStorage`, `window.location` or `import.meta.env` directly — the hook
does that and hands strings to the pure code.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **No new `.feature` file, against Principle IV's "every behavior MUST be specified in a `.feature` file before implementation"** | The `.feature` estate describes *artifact* behaviour and is executed *through* the playground: `ArtifactWorld` opens the playground, selects an artifact in it, and ticks its checkboxes. A feature file describing the playground's own chrome would make the harness its own subject — the runner would have to drive the playground to assert on the playground, and a failure could not distinguish "the playground is broken" from "the harness is broken". The behaviour here is also not artifact behaviour: it is dev-tool UI state and a source-code viewer. | A new `playground-features` package was considered and rejected: it would add a package, a Cucumber wiring layer and a second place where the playground's selectors are encoded — the exact duplication that makes `PlaygroundPage` the single owner of playground selectors today. Coverage is instead: pure-module `bun test` for every rule in the contracts (precedence, sanitisation, merge invariant, byte-identical srcdoc), Storybook stories for the visual surface, the existing suites run unchanged as the regression guard (FR-019), and the `quickstart.md` manual pass for the browser-only behaviours (reload, shared link). |

## Phase Status

- [x] Phase 0 — research complete → [research.md](./research.md)
- [x] Phase 1 — design complete → [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
- [x] Constitution re-check after Phase 1 — still PASS; the Phase 1 design removed the one
      standing risk (complexity creep in `ArtifactViewPanel`) by making the tab list data, and
      introduced no new package, dependency or boundary.
- [ ] Phase 2 — task breakdown (`/speckit-tasks`)
