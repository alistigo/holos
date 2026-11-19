# Tasks: Playground State Persistence & Source Tabs

**Input**: Design documents from `/specs/004-playground-state-source-tabs/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Branch**: `feat/004-playground-state-source-tabs` (already created)

**Tests**: INCLUDED and written first. Constitution Principle IV makes failing tests a
precondition for implementation, and `plan.md` records the one deviation (no new `.feature`
file — the `*-features` packages describe artifact behaviour executed *through* the playground,
so the playground's own chrome would make the harness its own subject). Coverage here is
`bun test` on the pure modules, Storybook stories on the visual surface, and the existing
end-to-end suites as the regression guard.

**Organization**: by user story, so each is independently deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 = form persistence, US2 = address parameters, US3 = source tabs, US4 = e2e compatibility

## Path Conventions

All paths are repository-relative. The app is `apps/alistigo-artifact-playground/`; the shared
end-to-end harness is `cli/artifact-features-runner-playwright/`.

---

## Phase 1: Setup

**Purpose**: capture the "before" state and give the app a place to run unit tests. Both must
happen before any source change.

- [X] T001 Record the end-to-end baseline before touching any source: run `pnpm nx run alistigo-artifact-playground:build`, then `pnpm nx run artifact-list:test:e2e 2>&1 | tee /tmp/004-list-e2e-before.txt` and `pnpm nx run artifact-ai-draw-comments:test:e2e 2>&1 | tee /tmp/004-draw-e2e-before.txt`, and write the two scenario pass counts into `specs/004-playground-state-source-tabs/baseline.md` — without this a pre-existing failure is indistinguishable from one this feature causes
- [X] T002 Replace the `test` target in `apps/alistigo-artifact-playground/project.json` with an `nx:run-commands` target whose `commands` array runs (1) `bun test` with `cwd` `apps/alistigo-artifact-playground` and (2) the existing `core-document-validator` fixture-validation command verbatim, **with `"parallel": false`** — `nx:run-commands` runs a `commands` array concurrently by default, which interleaves the two reports and leaves the ordering undefined — so `pnpm test` keeps validating the fixtures and starts running the new unit tests; per CLAUDE.md the task stays in `project.json` and is NOT duplicated into `package.json` scripts
- [X] T003 Verify the new `test` target in `apps/alistigo-artifact-playground/project.json` runs and finds nothing yet: `pnpm nx run alistigo-artifact-playground:test` must exit 0 with bun reporting no test files and the fixture validator still passing

**Checkpoint**: baseline recorded, unit tests runnable.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: US1 and US2 both consume the catalogue and the composition function. No user
story work starts until this phase is done.

- [X] T004 Extract `Config` and `PlaygroundMode` from `apps/alistigo-artifact-playground/src/hooks/useHostConfig.ts` into a new `apps/alistigo-artifact-playground/src/playground-config.ts`, re-exporting both from `useHostConfig` so `src/components/HostForm.tsx`, `src/components/HostPage.tsx` and `src/buildIframeSrcdoc.ts` keep compiling untouched — a prerequisite, not a tidy-up: `.dependency-cruiser.cjs` sets `tsPreCompilationDeps: true` (type-only imports are counted) with `no-circular` at `severity: "error"`, so the moment `useHostConfig` imports `playground-state.ts` (T014) while that module types its signatures with `Config`, the cycle fails `qa:arch-check` — a constitution MUST gate, and it would surface at T046 with every line of the feature already written
- [X] T005 Declare the `PlaygroundCatalog` interface in `apps/alistigo-artifact-playground/src/playground-config.ts` (beside `Config`, so every pure module can type against it without reaching for `constants.ts`) and add a `buildPlaygroundCatalog()` factory to `apps/alistigo-artifact-playground/src/constants.ts` — the only place that touches `ARTIFACT_REGISTRY` — returning exactly the four members from `contracts/playground-state.md`: `knownApps` (readonly string[], registry order, first entry is the fallback), `pluginsFor(app)` (delegating to the existing `getAvailablePlugins`), `documentNames` (readonly string[]), and `modeSelectable` (boolean — false in a production build, where the Source field is not rendered); the factory takes `documentNames` and `modeSelectable` as arguments so the pure modules never read `import.meta.env`
- [X] T006 [P] Write failing tests for `defaultConfig` and `composeConfig` in `apps/alistigo-artifact-playground/src/playground-state.test.ts` using a hand-built stub catalogue (never the real registry): `defaultConfig` returns `app` = the given default or `knownApps[0]`, `lang: "en"`, `aiContext: "claude"`, `readonly: false`, `document: ""`, `rawMarkdown: ""`, `plugins: {}`, `published: true`, `mode: "dev"`; `composeConfig(defaults, stored, overrides)` applies later arguments at higher precedence per field and ignores `undefined` fields (rule C-13)
- [X] T007 Create `apps/alistigo-artifact-playground/src/playground-state.ts` and implement `defaultConfig` and `composeConfig` so T006 passes, moving the existing `VITE_DEFAULT_ARTIFACT` / `KNOWN_APPS[0]` fallback logic out of `src/hooks/useHostConfig.ts` into `defaultConfig`'s `defaultApp` argument. Its only local import is `import type { Config, PlaygroundMode, PlaygroundCatalog } from "./playground-config"`: nothing from `constants.ts` (which pulls in the registry), nothing from `hooks/useHostConfig.ts` (that is the cycle T004 exists to prevent), and no `window`, `localStorage` or `import.meta.env` — it has to stay importable from `bun test`

**Checkpoint**: the catalogue and the precedence rule exist and are tested. US1, US2 and US3 can now proceed; US3 is already unblocked and touches no file US1/US2 touch.

---

## Phase 3: User Story 1 — The playground remembers my setup across a reload (Priority: P1) 🎯 MVP

**Goal**: the left `Config` form's every field survives a browser reload, restored and validated,
with the preview booting the restored artifact unaided.

**Independent Test**: change every field of the left form, reload, confirm each field and the
preview come back as left — with US2 and US3 absent.

### Tests for User Story 1 ⚠️

> Write these first and watch them fail.

- [X] T008 [US1] Add storage-key and envelope tests to `apps/alistigo-artifact-playground/src/playground-state.test.ts`: `PLAYGROUND_STATE_KEY` equals `"dev-playground:config:v1"` and `expect(PLAYGROUND_STATE_KEY.startsWith("alistigo")).toBe(false)` — rule C-1, because `useLocalStorageEntries` lists `startsWith("alistigo")` keys and presents them to the developer as the artifact's own storage (FR-006); `PLAYGROUND_STATE_VERSION` equals `1`; `serializePlaygroundState(config)` produces `{"v":1,"config":{…}}`, covering all nine fields (FR-002)
- [X] T009 [US1] Add `parsePlaygroundState` rejection tests to `apps/alistigo-artifact-playground/src/playground-state.test.ts`, one per rule: `null` → `{}` (C-2); non-JSON → `{}` with no throw (C-3); missing or wrong `v` → `{}` even when `config` is valid (C-4); absent or non-object `config` → `{}` (C-5)
- [X] T010 [US1] Add `parsePlaygroundState` field-validation tests to `apps/alistigo-artifact-playground/src/playground-state.test.ts`, quoting the constraints from `data-model.md` §1: `app` kept only if in `catalog.knownApps` else omitted (C-6); `plugins` keys filtered against `pluginsFor(effective app)` where *effective* means the restored `app` if it survived C-6 else the default, and a non-object plugin value becomes `{}` (C-7); `document` kept only if `""`, `"__raw__"` or in `catalog.documentNames` (C-8); `aiContext` kept only if in the playground's AI contexts, `mode` only if `"dev"` or `"prod-local"` **and** `catalog.modeSelectable` is true (C-9); `lang`/`rawMarkdown` must be strings and `readonly`/`published` booleans, a wrong type omitting the field rather than coercing it (C-10) — the nine together are FR-002's "every field of all three form sections"
- [X] T011 [US1] Add the two integrity tests to `apps/alistigo-artifact-playground/src/playground-state.test.ts`: one invalid field never discards a valid one — restore `{app: "@alistigo/does-not-exist", lang: "fr"}` and assert `lang` survives while `app` is omitted (C-11, FR-004); and a round trip — `parsePlaygroundState(serializePlaygroundState(c), catalog)` equals `c` for a config whose every field is valid for that catalogue (C-12)
- [X] T012 [US1] Add a validation-order test to `apps/alistigo-artifact-playground/src/playground-state.test.ts` proving `app` resolves before the fields scoped to it: a stored setup naming artifact B with a plugin only B offers must keep that plugin, while the same stored setup with an unknown artifact must drop the plugin (the B-scoped key is not valid for the fallback artifact) — the ordering rule in `data-model.md` §1

### Implementation for User Story 1

- [X] T013 [US1] Implement `PLAYGROUND_STATE_KEY`, `PLAYGROUND_STATE_VERSION`, `serializePlaygroundState` and `parsePlaygroundState` in `apps/alistigo-artifact-playground/src/playground-state.ts` until T008–T012 pass; `serializePlaygroundState` and `parsePlaygroundState` must never throw, and `parsePlaygroundState` resolves `app` first, then validates `document` and `plugins` against the effective artifact
- [X] T014 [US1] Rewrite `useHostConfig` in `apps/alistigo-artifact-playground/src/hooks/useHostConfig.ts` to import `playground-state.ts` and `buildPlaygroundCatalog()`, re-export `Config` and `PlaygroundMode` from `playground-config.ts` (T004) rather than declaring them, and compute its initial state once as `composeConfig(defaultConfig(catalog, DEFAULT_ARTIFACT), parsePlaygroundState(read(), catalog), {})` — as the `useState` initial value, not in an effect (research R4: an effect-based restore boots the iframe twice and gives the e2e harness a window where the combobox and the iframe disagree) — keeping the exported `Config` and `PlaygroundMode` types and the `{ config, setConfig }` return shape unchanged, so the restored setup boots the preview with no developer action (FR-003)
- [X] T015 [US1] Add the persist-on-change effect to `apps/alistigo-artifact-playground/src/hooks/useHostConfig.ts`: write `serializePlaygroundState(config)` to `PLAYGROUND_STATE_KEY` whenever `config` changes (H-2, FR-001), with no storage read after init (H-4, so a second tab cannot yank the form mid-session)
- [X] T016 [US1] Wrap every `localStorage` access in `apps/alistigo-artifact-playground/src/hooks/useHostConfig.ts` in try/catch so a throwing or unavailable store degrades to "no persistence": a read that throws must not blank the form and a write that throws must not break typing (H-3, FR-005); do not log through `console` — constitution forbids it in app code, and the failure is expected in private browsing
- [X] T017 [US1] Re-write the persisted envelope after Clear Data, in `apps/alistigo-artifact-playground/src/components/HostPage.tsx`'s `handleClearData`: the preview iframe is a `srcdoc` with `allow-same-origin`, so `clearData()`'s `iframe.contentWindow.localStorage.clear()` (`src/hooks/useIframeControls.ts:12-18`) is an **origin-wide** clear that deletes `dev-playground:config:v1` as well, while the form goes on showing its values and the persist effect (deps: `config`) never re-fires — so the setup vanishes at the next page load with nothing on screen to suggest it would. Write the current config back through `serializePlaygroundState` once the clear resolves. Do **not** narrow the clear to `alistigo`-prefixed keys instead: the list artifact persists under the bare key `document` (`packages/artifact-list/src/utils/list-key-value-adapter.ts:12`), which that filter would stop clearing (FR-022)
- [X] T018 [US1] Isolate `apps/alistigo-artifact-playground/src/components/HostPage.stories.tsx` from the persisted setup: it renders `HostPage`, which from T014 reads and writes real `localStorage` inside the Storybook iframe, so stories now inherit one another's configuration and leave a `dev-playground:config:v1` entry behind for the next session. Clear the key before each story renders — a `beforeEach` in the story annotations (Storybook 10) or a decorator — so every story starts from the documented defaults, and confirm the story still renders: `qa:stories-check` requires this file, and Storybook is where the panel gets reviewed in isolation

**Checkpoint**: US1 is fully functional. Validate with `quickstart.md` §3 — including the corrupted-value and private-window cases — and `pnpm nx run alistigo-artifact-playground:test`.

---

## Phase 4: User Story 2 — I can hand someone a link that opens the right artifact (Priority: P1)

**Goal**: `?artifact=` and `?source=` seed the form on load, beating stored values for their own
fields only, and never fighting a later selection.

**Independent Test**: open the playground with an address naming an artifact and a source, and
confirm both the form and the preview honour it.

**Depends on**: Phase 2. Shares `src/hooks/useHostConfig.ts` with US1, so T023 follows T014.

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Write failing resolution tests in `apps/alistigo-artifact-playground/src/playground-url.test.ts` against a stub catalogue: `URL_PARAM_ARTIFACT` is `"artifact"` and `URL_PARAM_SOURCE` is `"source"`; `?artifact=@alistigo/artifact-list` resolves by exact key; `?artifact=artifact-list` and `?artifact=list` resolve by unique suffix; an ambiguous suffix is omitted; matching is case-insensitive, trims surrounding whitespace and operates on the URL-decoded value so `%40alistigo%2Fartifact-list` resolves (U-3) — this is FR-007's "accept the artifact selection as a parameter"
- [X] T020 [P] [US2] Add `source` and omission tests to `apps/alistigo-artifact-playground/src/playground-url.test.ts`: `dev` → `"dev"`; `prod-local`, `prod local` and `prod_local` → `"prod-local"`; any other value omitted (FR-008, FR-010); the whole `mode` field omitted when `catalog.modeSelectable` is false (U-2, data-model R-9); `parseUrlOverrides("")` → `{}` (U-1); a repeated parameter uses the first occurrence (U-4); only `app` and `mode` are ever returned (U-5)
- [X] T021 [P] [US2] Add precedence tests to `apps/alistigo-artifact-playground/src/playground-state.test.ts` exercising `composeConfig` with all three layers: an override beats the stored value for its own field while every other field keeps what storage gave (U-7, FR-009), and a stored field with no override and no default change survives untouched

### Implementation for User Story 2

- [X] T022 [US2] Create `apps/alistigo-artifact-playground/src/playground-url.ts` implementing `URL_PARAM_ARTIFACT`, `URL_PARAM_SOURCE` and `parseUrlOverrides(search, catalog): Partial<Pick<Config, "app" | "mode">>` until T019–T021 pass, typing itself from `./playground-config` only (same no-cycle rule as T007) — the module FR-007 and FR-008 are delivered by; it takes the search string as an argument and must not read `window.location` itself, and must contain no `history.pushState`, `replaceState` or `location` assignment (U-6, R-9 — the app never writes to its own address)
- [X] T023 [US2] Extend the initial-state computation in `apps/alistigo-artifact-playground/src/hooks/useHostConfig.ts` to pass `parseUrlOverrides(window.location.search, catalog)` as `composeConfig`'s third argument, read exactly once at init with no effect watching the address — so a selection the developer makes afterwards is final (U-8, FR-011) and an applied override is thereafter indistinguishable from a manual choice, persisted by the next write (R-10)

**Checkpoint**: US1 and US2 both work. Validate with `quickstart.md` §4, including the precedence pair (steps 2 and 3).

---

## Phase 5: User Story 3 — I can read the injected page as four separate, purposeful pieces (Priority: P2)

**Goal**: three new preview tabs, each showing one segment of the injected document in the same
coloured viewer, with the existing Source tab still showing the whole — and the merge property
true by construction.

**Independent Test**: open each new tab and confirm it shows its own piece, syntax-coloured, and
that the automated partition test passes.

**Depends on**: Phase 2 only. Touches no file US1/US2 touch, so it can run fully in parallel with
Phases 3–4.

### Tests for User Story 3 ⚠️

- [X] T024 [US3] Capture the byte-identity baseline **before refactoring**: create `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.test.ts` with the expected srcdoc strings recorded from the current implementation for the six configurations in rule S-1 — Claude context with AI input and plugins; Claude context without AI input; `aiContext: "none"`; `published: false`; `mode: "dev"` and `mode: "prod-local"`; and the `@alistigo/artifact-ai-draw-comments` artifact (host surface present) — using stub `assets` values, and assert `assembleSrcdoc(buildIframeParts(o))` equals each recorded string character for character, whitespace included (S-1, the main protection for FR-019)
- [X] T025 [US3] Add the partition tests to `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.test.ts`: concatenating the five segments' parts in document order reproduces the assembled document and no part is untagged (S-2, FR-017 first half); every part carries exactly one segment so no text can appear under two tabs (S-3, FR-017 second half, and the invariant that lets Config and AI Input own a segment they render in readable form per FR-023); `buildIframeParts` returns parts in document order and `segmentSource` preserves it (S-4)
- [X] T026 [US3] Add the segment-content tests to `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.test.ts`: `aiContext` ≠ `"claude"` ⇒ the `ai-bridge` segment has no parts and `segmentSource(parts, "ai-bridge")` is `""` (S-5, FR-013); `published: false` ⇒ no `claudeArtifactStatus` part with the rest of `ai-bridge` unchanged (S-6); no AI input ⇒ the `ai-input` segment has no parts (S-7); the `artifact` segment contains `scriptUrl` and contains neither `alistigo-config` nor `ai-input-action` nor the stub bridge marker (S-8, FR-014); the `playground` segment contains none of the other segments' markers (S-9, FR-015); and `buildArtifactConfig`'s output is unchanged, because the harness parses `#alistigo-config` to decide which artifact the preview holds (S-11)

### Implementation for User Story 3

- [X] T027 [US3] Create `apps/alistigo-artifact-playground/src/srcdoc-assets.ts` holding every Vite-resolved value currently at module scope in `buildIframeSrcdoc.ts` — the `@alistigo/claude-artifact-api/inject-script.html?raw` import, the `html-to-image/dist/html-to-image.js?url` import, the `__ALISTIGO_DEV_HOSTNAME__`-derived `SRCDOC_CSP`, and the `import.meta.env` reads — and export a `SrcdocAssets` value `{ bridgeHtml, htmlToImageUrl }`; this is what makes `buildIframeSrcdoc.ts` importable from `bun test` at all (R-7)
- [X] T028 [US3] Refactor `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.ts` into the part model from `contracts/srcdoc-segments.md`: export `SrcdocSegment`, `SrcdocPart`, `SrcdocAssets`, `buildIframeParts(options): SrcdocPart[]`, `assembleSrcdoc(parts)` joining with `""`, `segmentSource(parts, segment)` joining that segment's parts with `"\n"` and returning `""` when empty, and keep `buildIframeSrcdoc(options)` as a wrapper equal to `assembleSrcdoc(buildIframeParts(options))`; add `assets: SrcdocAssets` to `BuildIframeSrcdocOptions`, leave `SRCDOC_CSP` to `srcdoc-assets.ts` and import it from there (re-exporting it closes a cycle), keep `buildArtifactConfig` untouched, and carry the template's existing whitespace inside the parts' `text` so T024 passes
- [X] T029 [US3] In `apps/alistigo-artifact-playground/src/buildIframeSrcdoc.ts`, assign every part its segment per the table in `contracts/srcdoc-segments.md`, including the three judgement calls from research R5: `window.claudeArtifactStatus` is `ai-bridge` (the real Claude host sets it), the plugin-URL-override script and the React-refresh preamble are `playground` (local dev plumbing that no real artifact has), and the draw-comments host surface is `playground` (host content supplied for a widget to annotate, not part of the artifact bundle)
- [X] T030 [P] [US3] Generalise `apps/alistigo-artifact-playground/src/components/SourceView.tsx`: rename the `html` prop to `code`, add a required `label` replacing the hard-coded `srcdoc HTML` caption, and add an optional `emptyMessage` rendered in place of the highlighter when `code` is empty; keep the existing `prism-react-renderer` night-owl rendering, style only with Tailwind classes (constitution forbids plain CSS and inline `style` props in new code). Harden `handleCopy` while it is becoming a four-caller component: it currently does `void navigator.clipboard.writeText(...)`, which throws a `TypeError` outright where `navigator.clipboard` is undefined (a non-secure context) — guard the access and leave the button inert rather than letting it break the panel, and suppress the Copied! flash when the write did not happen (FR-016)
- [X] T031 [P] [US3] Update `apps/alistigo-artifact-playground/src/components/SourceView.stories.tsx` for the renamed and new props — the three existing stories pass `html`, which no longer exists — with a story per shape: a full srcdoc labelled `srcdoc HTML`, a short bridge snippet, and an empty segment showing its `emptyMessage`, so each of the four tab presentations is reviewable in isolation (required by `qa:stories-check`, ADR-0012)
- [X] T032 [US3] Rework the tab list in `apps/alistigo-artifact-playground/src/components/ArtifactViewPanel.tsx` into a data-driven array of `{ id, label, render }` and extend `Tab` with `"ai-bridge" | "artifact-source" | "playground-source"`, inserting the three new tabs **directly after `Source`**, so the row reads `App`, `Source`, `AI Bridge`, `Artifact source`, `Playground source`, `Config`, `AI Input` — the four code views group together, and the existing four keep their names, their relative order and their behaviour while `Config` and `AI Input` shift two places right (FR-012): labels exactly `AI Bridge`, `Artifact source`, `Playground source`; at seven tabs the row needs `flex-wrap` so it survives the panel's half-width layout; the data-driven list is what keeps the component's branching flat so the single existing `fallow-ignore-next-line complexity` stays accurate instead of covering more (research R8)
- [X] T033 [US3] Render the three new tabs in `apps/alistigo-artifact-playground/src/components/ArtifactViewPanel.tsx` through `SourceView`, per the UI contract table: `AI Bridge` shows `segmentSource(parts, "ai-bridge")` with `emptyMessage` `"This AI context injects no bridge code."` (FR-013), `Artifact source` shows `segmentSource(parts, "artifact")`, `Playground source` shows `segmentSource(parts, "playground")`, and the existing `Source` tab keeps showing the assembled document; accept the parts as a new prop rather than rebuilding the srcdoc in the panel. Leave the `Config` and `AI Input` tabs on `JsonPanel` and `AiInputPanel` — the three new tabs show their segment verbatim, those two keep their readable presentations and still own their segment for the partition in FR-017 (FR-023)
- [X] T034 [US3] Update `apps/alistigo-artifact-playground/src/components/HostPage.tsx` to `useMemo` the parts once from `buildIframeParts({…, assets: SRCDOC_ASSETS})`, pass `assembleSrcdoc(parts)` to the iframe and the parts to `ArtifactViewPanel`, so all tabs and the preview derive from one build and every tab updates when the form changes (FR-018). Keep `configJson` as its own `useMemo` over `buildArtifactConfig(config)` and add a one-line comment saying why: the Config tab wants the object indented for reading while the `config` segment must stay compact to keep the srcdoc byte-identical (S-1), so the two renderings are deliberate and already share their one derivation in `buildArtifactConfig`. Do **not** recover the JSON by stripping the script tag out of the segment text
- [X] T035 [P] [US3] Update `apps/alistigo-artifact-playground/src/components/ArtifactViewPanel.stories.tsx` to cover the new tab set, with at least a Claude-context story and an `aiContext: "none"` story so the AI Bridge empty state is visible in Storybook

**Checkpoint**: US3 complete. Validate with `quickstart.md` §5 and the segment tests; if T024's byte-identity test fails, stop — the end-to-end suites will fail too.

---

## Phase 6: User Story 4 — The existing end-to-end suites keep passing (Priority: P1)

**Goal**: prove FR-019 rather than assume it, and correct the one harness comment this feature
falsifies.

**Independent Test**: run both suites unchanged against the modified playground and match the
Phase 1 baseline.

**Depends on**: Phases 3, 4 and 5 — this verifies the finished behaviour.

- [X] T036 [US4] Correct the stale premise in the `reloadArtifact` doc comment in `cli/artifact-features-runner-playwright/src/harness/world.ts` (around line 103): it currently states the playground "keeps the chosen artifact in React state only — no URL parameter, no storage" and uses that as the *reason* re-selection is needed after a reload. State instead that the selection now persists in `localStorage`, that re-selecting remains correct and is usually a no-op, and that it is still required because `seedStorage` clears that storage; comment only — do not change the behaviour, or the next reader deletes a step that is still needed
- [X] T037 [US4] Rebuild and run both suites unchanged — `pnpm nx run alistigo-artifact-playground:build`, then `pnpm nx run artifact-list:test:e2e` and `pnpm nx run artifact-ai-draw-comments:test:e2e` — and compare the scenario pass counts against `specs/004-playground-state-source-tabs/baseline.md` from T001; no `.feature` file and no step definition may be edited (FR-019)
- [X] T038 [US4] Inspect the three focus results from research R10 in that run: the `@artifact-plugins` scenarios in `list-features` (they tick a plugin checkbox then reload, and plugin selections now survive that reload); draw-comments' *"Reloading the artifact discards an in-progress annotation"*, which the `world.ts` comment names as the guard for the reload-then-reselect ordering this change actually alters; and any scenario using `Given a list:`, which seeds storage — clearing the playground's own key as a side effect — and must still come back on the right artifact
- [X] T039 [US4] Confirm FR-020 explicitly against `cli/artifact-features-runner-playwright/src/harness/world.ts`'s per-scenario context: a fresh browser context starts the playground from its documented defaults. `ArtifactWorld.beforeScenario` calls `browser.newContext()` per scenario, so verify by asserting in the run that a scenario following one that changed the form still begins on defaults — if it does not, the persistence key is leaking across contexts and that is a blocker, not a polish item
- [X] T040 [US4] Confirm FR-021 in the `vite preview` build the suites use, against `apps/alistigo-artifact-playground/src/components/HostPage.tsx`'s `resolveScriptUrl`: under `vite preview`, `import.meta.env.DEV` is false, so the *Source* field is not rendered, `modeSelectable` is false and the `source` parameter is inert — check that a reload mid-run leaves the artifact selection in effect and that the inert `mode` path does not reintroduce a dev-only script URL

**Checkpoint**: all four stories complete and the regression guard is green.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T041 [P] Document the two address parameters in `apps/alistigo-artifact-playground/README.md` — `?artifact=` (full registry key or unique suffix) and `?source=dev|prod-local` (development only) — with a worked example link and a note that values the playground does not offer are ignored rather than fatal
- [X] T042 [P] Note the persisted setup in `apps/alistigo-artifact-playground/README.md`: the single `dev-playground:config:v1` key, what it covers, that the Claude Simulator's own controls and the active tabs are deliberately not persisted, and how to reset it — deleting the key by hand, since per T017 Clear Data deliberately clears the *artifact's* storage and leaves the form setup standing
- [X] T043 [P] Check whether `apps/alistigo-artifact-playground/public/llms.txt` and `public/mcp-tool.json` describe the playground's URL surface; if either does, add the two parameters there so an agent opening the playground can target an artifact directly
- [X] T044 Run `pnpm biome check --write .` and stage every auto-fixed file in the same commit (constitution: Biome before every commit)
- [X] T045 Run `pnpm nx run alistigo-artifact-playground:typecheck` and fix any strict-mode fallout — `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` are on, and the `Partial<Config>` merging in `composeConfig` plus the `parts.filter` indexing are where they bite
- [X] T046 Run the full gate set `pnpm nx run holos:qa` and resolve findings at source: `qa:stories-check` fails if any touched component lacks its co-located story, `qa:dead-code`/`qa:audit` will flag the old `buildIframeSrcdoc` internals if any are left unreferenced after the refactor, and no `--no-verify` bypass is permitted
- [X] T047 Walk `specs/004-playground-state-source-tabs/quickstart.md` §3, §4 and §5 by hand in `pnpm nx run alistigo-artifact-playground:dev` and tick its "Done when" list, including the corrupted-value, unknown-artifact and private-window cases that no automated test covers
- [X] T048 Open the pull request for `feat/004-playground-state-source-tabs` with the baseline-versus-after scenario counts from T001 and T037 in the description, so the reviewer can see FR-019 was measured rather than asserted

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies. T001 must precede every source change — the baseline cannot be recorded afterwards.
- **Phase 2 (Foundational)**: needs Phase 1. **Blocks every story** — T004 blocks US1, US2 *and* US3, because `buildIframeSrcdoc.ts` also types itself with `Config`. T005 and T007 block US1 and US2. US3 needs T004 plus T002/T003 of Phase 1 for a test runner.
- **Phase 3 (US1)**: needs Phase 2.
- **Phase 4 (US2)**: needs Phase 2; T023 needs T014 (same file).
- **Phase 5 (US3)**: needs Phase 2 for the test runner only; file-disjoint from US1/US2.
- **Phase 6 (US4)**: needs Phases 3, 4 and 5.
- **Phase 7 (Polish)**: needs Phase 6, except T041–T043 which only need the behaviour they document.

### Within Each Story

Tests first and failing, then implementation, then wiring:
US1 — T008…T012 → T013 → T014 → T015 → T016 → T017 → T018 (T018 is independent of T017; both follow T014).
US2 — T019…T021 → T022 → T023.
US3 — T024 (baseline capture, before any refactor) → T025, T026 → T027 → T028 → T029 → T030/T032 → T033 → T034 → stories.

### Parallel Opportunities

- T006 runs alongside T005.
- **US3 (Phase 5) runs in parallel with US1+US2 (Phases 3–4)** — the largest win here. US1/US2 live in `playground-state.ts`, `playground-url.ts` and `hooks/useHostConfig.ts`; US3 lives in `buildIframeSrcdoc.ts`, `srcdoc-assets.ts` and `components/`. **One file is now shared**: `components/HostPage.tsx`, edited by T017 (US1, the Clear Data write-back) and T034 (US3, the parts wiring). Sequence those two rather than running them at once; everything else in the two tracks stays disjoint.
- T019, T020, T021 are three independent test tasks.
- T030 and T032 touch different components; T031 and T035 are independent story files.
- T041, T042, T043 are independent documentation files.
- Within US1, T008–T012 all append to one test file, so they are *not* marked [P] despite being independent in content.

### Critical Path

T001 → T002 → T004 → T005 → T007 → T013 → T014 → T017 → T023 → T037 → T046 → T048, with Phase 5 folded in alongside.

---

## Implementation Strategy

### MVP (deliverable on its own)

**Phase 1 + Phase 2 + Phase 3 (US1)** — 18 tasks — the form survives a reload. This is the friction the
developer hits many times an hour, and it ships without US2 or US3 existing. Stop here and the
feature already pays for itself; run `quickstart.md` §3 to confirm.

### Increment 2

**Phase 4 (US2)** — shareable links. Small (two tasks of implementation) and it makes the
persisted state overridable rather than sticky.

### Increment 3

**Phase 5 (US3)** — the three source tabs. Independent of both earlier increments and the largest
single chunk; start it in parallel if there is capacity.

### Always

**Phase 6 (US4)** before any merge. The e2e suites are the regression guard for the whole feature,
and T024's byte-identity test is the cheap early warning: if it fails, the suites will too.

---

## Implementation Notes (2026-11-19)

All 48 tasks complete. Four places where reality differed from the plan, recorded because each
would otherwise mislead the next reader.

### T003 — `bun test` exits non-zero when it finds no test files

The task expected the new `test` target to run green before any test existed. It cannot:
`bun test` reports `error: 0 test files matching …` and exits 1. The target was verified instead at
T007, once `playground-state.test.ts` existed. Nothing about the target was wrong.

### T002 — per-command `cwd` is not in this Nx version's `run-commands` schema

The plan assumed each entry of a `commands` array could carry its own `cwd`. It cannot
(`Property 'commands' does not match the schema`). The target uses one top-level
`cwd: apps/alistigo-artifact-playground` and invokes the fixture validator by path
(`bun ../../cli/core-document-validator/src/cli.ts`), which also matches the repo's
workspace-bin convention. `"parallel": false` is set, per D4.

### Research R7's premise was wrong — `bun` *does* resolve `?raw` and `?url`

R7 justified extracting `srcdoc-assets.ts` on the grounds that `bun test` cannot resolve Vite's
module queries. Measured: it resolves them fine (`SRCDOC_ASSETS.bridgeHtml` loads all 8796
characters under `bun test`). The extraction is still right, for the reason the tests actually
depend on — it keeps the builder a pure function of its arguments, so a test can inject a stub
bridge and assert the AI-bridge segment contains exactly it, rather than asserting against the real
8.8 KB bridge. R7 in `research.md` has been corrected rather than left standing.

### A cycle was briefly introduced, and caught

Mid-implementation `buildIframeSrcdoc.ts` re-exported `SRCDOC_CSP` from `srcdoc-assets.ts`
"for compatibility", as `contracts/srcdoc-segments.md` originally specified — while
`srcdoc-assets.ts` imports the `SrcdocAssets` type back from it. That is exactly the cycle T004
exists to prevent. The re-export is gone; `HostPage` imports the CSP from `srcdoc-assets.ts`
directly, and the contract has been corrected. `pnpm qa:arch-check` reports no violations across
420 modules, and the playground's own 40-module graph is clean.

### Verification performed beyond the automated tests

Three throwaway Playwright probes (not kept — the suites and unit tests are the durable coverage)
confirmed, in both builds:

| What | Result |
|---|---|
| FR-020 fresh context → defaults; FR-021 reload keeps the selection; FR-007/FR-008 in the `vite preview` build | 8/8 checks |
| SC-002 all fields survive a reload; FR-004/FR-005 corrupt, wrong-version and dead-artifact entries; FR-009/FR-010/FR-011 precedence; FR-022 Clear Data; FR-013/FR-014/FR-015/FR-017 tab contents | 15/15 checks |
| Plugin + its edited config persist across a reload | pass |
| FR-016 the Source tab copies the injected document byte for byte (12178 chars, 255 lines, identical to the iframe's `srcdoc`); all four tabs flash *Copied!* | pass |
| FR-005 with `localStorage` denied (private-window shape): opens, works, zero page errors | pass |

### Known pre-existing failure, untouched

`qa:artifact-arch-check` reports `Dependency Boundaries: @alistigo/artifact-list declares
forbidden dependency @alistigo/list-features`. Confirmed pre-existing by stashing this branch's
work and re-running — identical failure. Unrelated to this feature and left alone;
`pnpm nx run holos:qa` still exits successfully.

### Observation for later, not acted on

`fallow audit` notes a 15-line clone group across `ArtifactViewPanel.tsx`, `ClaudeSimulator.tsx`
and `HostForm.tsx` — the tab-button markup, identical in all three before this change and still
identical after. The audit gate treats it as inherited and passes. Extracting a shared `TabButton`
would be a real cleanup; it needs its own story under `qa:stories-check`, so it belongs in its own
change rather than smuggled into this one.
