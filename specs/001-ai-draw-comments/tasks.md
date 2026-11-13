# Tasks: AI Draw Comments

**Input**: Design documents from `specs/001-ai-draw-comments/`

**Feature**: `@alistigo/artifact-ai-draw-comments` — embeddable Claude artifact widget for visual draw annotations

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label [US1], [US2], [US3]
- Exact file paths included in every task description

---

## Phase 1: Setup (Scaffold Packages)

**Purpose**: Create all three workspace packages and extend the existing API package. No user story work starts here — just scaffolding.

- [x] T001 Extend `packages/claude-artifact-api/src/index.ts`: add `ClaudeMessageContent` union type and `complete(content: ClaudeMessageContent[]): Promise<string>` overload to `ClaudeApi` interface (verbatim from data-model.md)
- [x] T002 [P] Scaffold `packages/artifact-ai-draw-comments/` via `bash packages/artifact-dev-tools/scripts/new-package.sh artifact-ai-draw-comments`; set `"alistigo": { "type": "widget" }` in `packages/artifact-ai-draw-comments/package.json`; add `konva`, `react-konva`, `@radix-ui/react-*` primitives, `@radix-ui/colors`, `lucide-react`, `@lingui/react`, `@lingui/macro` to dependencies; add `vite`, `@lingui/vite-plugin` as dev dependencies; add `@alistigo/claude-artifact-api` and `@alistigo/logger` as `workspace:*` dependencies
- [x] T003 [P] Scaffold `packages/artifact-ai-draw-comments-skill/` via `bash packages/artifact-dev-tools/scripts/new-package.sh artifact-ai-draw-comments-skill`; set `"alistigo": { "type": "skill" }` in `packages/artifact-ai-draw-comments-skill/package.json`; delete the generated `src/` directory (skill has no source)
- [x] T004 [P] Scaffold `packages/artifact-ai-draw-comments-features/` via `bash packages/artifact-dev-tools/scripts/new-package.sh artifact-ai-draw-comments-features`; create `packages/artifact-ai-draw-comments-features/features/` and `packages/artifact-ai-draw-comments-features/step-definitions/` directories; add `@alistigo/artifact-ai-draw-comments` as `workspace:*` dependency; install `@cucumber/cucumber` (or `vitest-cucumber`) as a devDependency; add a `test` target to `packages/artifact-ai-draw-comments-features/project.json` that runs the Gherkin runner against `features/**/*.feature` with step definitions from `step-definitions/`; verify `nx run artifact-ai-draw-comments-features:test` resolves (even if 0 scenarios pass yet)

**Checkpoint**: Three new packages exist in `packages/`; `pnpm install` succeeds; `nx run-many -t typecheck` runs without missing-package errors

---

## Phase 2: Foundational (Domain + Gherkin Before Code)

**Purpose**: Domain layer and Gherkin feature files must exist before any React component is written. This is a constitution hard gate: Gherkin before implementation, domain layer has zero external imports.

**⚠️ CRITICAL**: No component or application-layer code may be authored until T005–T013 are complete.

- [x] T005 Add `packages/artifact-ai-draw-comments/src/globals.d.ts`: declare `window.htmlToImage` as `typeof import("html-to-image")` global (no npm dependency — the library is pre-loaded at `https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js` in every Claude artifact iframe)
- [x] T006 [P] Implement `packages/artifact-ai-draw-comments/src/domain/shapes.ts`: export `DrawShape` type with fields `type: "rectangle" | "line"`, `startX: number`, `startY: number`, `endX: number`, `endY: number`, `strokeColor: string` (default `"#ef4444"`); no external imports
- [x] T007 [P] Implement `packages/artifact-ai-draw-comments/src/domain/session.ts`: export `SessionStatus` union (`"idle" | "selecting" | "drawing" | "submitting" | "sent" | "responded"`); export `SelectionRegion` interface (`x: number`, `y: number`, `width: number` (≥20), `height: number` (≥20)); export `SessionEvent` union type with variants `AnnotationStarted`, `RegionSelected`, `ShapeDrawn`, `CommentUpdated`, `AnnotationSubmitting`, `AnnotationSent`, `SendFailed`, `ClaudeResponded`, `AnnotationCancelled` (each with an `at: number` timestamp — see data-model.md); export `SessionEventLog` type (`{ sessionId: string; events: SessionEvent[] }`); export `DrawCommentSession` interface (derived view — same fields as before: `id`, `status`, `region`, `shapes`, `comment`, `snapshot`, `claudeResponse`, `error`); export `projectSession(log: SessionEventLog): DrawCommentSession` pure projector; export `canSend(session: DrawCommentSession): boolean` guard (`shapes.length > 0 OR comment.trim().length > 0`); no external imports
- [x] T008 Implement `packages/artifact-ai-draw-comments/src/domain/snapshot.ts`: export `AnnotatedSnapshot` interface (fields: `pngBase64: string`, `comment: string`, `capturedAt: number`); export `buildAnnotatedSnapshot(regionEl: HTMLElement, konvaStage: import("konva/lib/Stage").Stage, comment: string): Promise<AnnotatedSnapshot>` — (1) `window.htmlToImage.toPng(regionEl)` → DOM base64; (2) `konvaStage.toDataURL()` → shapes layer base64; (3) composite both onto an offscreen canvas; (4) return `canvas.toDataURL("image/png").split(",")[1]`; depends on T005, T006
- [x] T009 [P] Write `packages/artifact-ai-draw-comments-features/features/draw-comment-send.feature`: Gherkin scenarios for all 6 US1 acceptance scenarios from spec.md (button visible → crosshair → selection indicator → transparent canvas overlay + toolbar → rectangle drawn with underlying content visible → Send generates PNG + submits to Claude → canvas switches read-only); tag with `@P1`
- [x] T010 [P] Write `packages/artifact-ai-draw-comments-features/features/claude-response.feature`: Gherkin scenarios for all 3 US2 acceptance scenarios from spec.md (Claude response appears inline below annotation without reload; annotation PNG + comment still visible above; "Draw Comment" button re-activates after response); tag with `@P2`
- [x] T011 [P] Write `packages/artifact-ai-draw-comments-features/features/embed-host.feature`: Gherkin scenarios for all 2 US3 acceptance scenarios from spec.md (button visible in host artifact on load; annotated PNG captures host artifact content); tag with `@P3`
- [x] T012 Implement `packages/artifact-ai-draw-comments/src/application/claude-bridge.ts`: export `sendAnnotation(snapshot: AnnotatedSnapshot): Promise<string>` — calls `window.claude.complete([{ type: "image", source: { type: "base64", media_type: "image/png", data: snapshot.pngBase64 } }, { type: "text", text: snapshot.comment || "(no comment)" }])`; throws `ClaudeUnavailableError` if `typeof window.claude === "undefined"`; depends on T001, T008
- [x] T013 Implement `packages/artifact-ai-draw-comments/src/application/send-annotation.ts`: export `sendAnnotationUseCase(session: DrawCommentSession, regionEl: HTMLElement, konvaStage: Stage): Promise<string>` — (1) validates `canSend(session)`; (2) calls `buildAnnotatedSnapshot`; (3) calls `sendAnnotation`; throws on failure (caller sets `error` on session); depends on T008, T012

**Checkpoint**: Domain layer is pure TypeScript with no DOM/React imports; Gherkin features pass linting (`nx run artifact-ai-draw-comments-features:lint`); `nx run artifact-ai-draw-comments:typecheck` passes

---

## Phase 3: User Story 1 — Annotate and Send (Priority: P1) 🎯 MVP

**Goal**: A user can click "Draw Comment", select a region, draw shapes on the transparent overlay, write a comment, hit "Send", and have the annotated PNG transmitted to Claude. The canvas then switches to read-only.

**Independent Test**: Follow `specs/001-ai-draw-comments/quickstart.md` Scenario 1 (Standalone — Full Draw-Comment-Send Cycle). Confirm: crosshair cursor on button click; transparent overlay after drag-select; rectangle draws without hiding underlying content; Send generates PNG within 3 seconds; canvas becomes read-only after send.

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `packages/artifact-ai-draw-comments/src/components/DrawCommentButton.tsx` and co-located `DrawCommentButton.stories.tsx`: renders a persistent button (always visible at top of container, FR-001); props: `onClick: () => void`, `disabled?: boolean`, `disabledReason?: string`; story shows default, disabled, and disabled-with-tooltip states
- [x] T015 [P] [US1] Create `packages/artifact-ai-draw-comments/src/components/ErrorBanner.tsx` and co-located `ErrorBanner.stories.tsx`: inline error message below canvas (FR-016, not a toast/modal); props: `message: string`, `onDismiss: () => void`; story shows error state with retry context message
- [x] T016 [US1] Create `packages/artifact-ai-draw-comments/src/components/SelectionOverlay.tsx` and co-located `SelectionOverlay.stories.tsx`: fullscreen transparent overlay that changes cursor to crosshair (FR-002); listens to `mousedown`/`mousemove`/`mouseup` to capture a `SelectionRegion` (minimum 20×20 px enforced — nudge user if below threshold); on Escape key dispatches `onCancel`; props: `onSelect: (region: SelectionRegion) => void`, `onCancel: () => void`; story shows selection-in-progress and minimum-size-warning states; depends on T007
- [x] T017 [P] [US1] Create `packages/artifact-ai-draw-comments/src/components/DrawToolbar.tsx` and co-located `DrawToolbar.stories.tsx`: rectangle tool button and line tool button (FR-004); props: `activeTool: "rectangle" | "line"`, `onToolChange: (tool: "rectangle" | "line") => void`; story shows each tool selected state
- [x] T018 [P] [US1] Create `packages/artifact-ai-draw-comments/src/components/CommentInput.tsx` and co-located `CommentInput.stories.tsx`: multi-line textarea + "Send" button (FR-006); "Send" button disabled when `shapes.length === 0 && comment.trim() === ""` (FR-007); props: `comment: string`, `shapes: DrawShape[]`, `onCommentChange: (v: string) => void`, `onSend: () => void`, `isSending?: boolean`; story shows enabled, disabled, and sending states; depends on T006
- [x] T019 [US1] Create `packages/artifact-ai-draw-comments/src/components/DrawCanvas.tsx` and co-located `DrawCanvas.stories.tsx`: Konva `Stage` + `Layer` positioned absolutely over the selected region (FR-003, FR-005); uses `react-konva`; supports rectangle tool (draws `Konva.Rect`) and line tool (draws `Konva.Line`); background of Stage is transparent so underlying artifact content shows through (FR-005, FR-002 SC-002: 100% content visible — no opacity/visibility change to content below); maintains `shapes: DrawShape[]` state; exposes `stageRef` for PNG export; props: `region: SelectionRegion`, `activeTool: "rectangle" | "line"`, `onShapesChange: (shapes: DrawShape[]) => void`, `stageRef: React.RefObject<Stage>`; story shows empty canvas and canvas-with-shapes states; depends on T006, T007
- [x] T020 [US1] Create `packages/artifact-ai-draw-comments/src/components/AnnotationThread.tsx` and co-located `AnnotationThread.stories.tsx`: read-only display of a completed session — shows the annotated PNG (`snapshot.pngBase64`) + comment + loading indicator while `claudeResponse` is null + Claude response text when available (FR-010, FR-011, US2 SC-004); props: `session: DrawCommentSession`; story shows sent-loading and sent-with-response states; depends on T007
- [x] T021 [US1] Implement `packages/artifact-ai-draw-comments/src/App.tsx`: root React component; primary state is `logs: SessionEventLog[]` (event sourcing — never mutate directly); derive display sessions via `logs.map(projectSession)`; all mutations append events to the relevant log (e.g., `appendEvent(logId, { type: "RegionSelected", region, at: Date.now() })`); renders `DrawCommentButton` (disabled when active session status is not `idle` or `responded`); handles event-driven state transitions; renders `SelectionOverlay` during `selecting`; renders `DrawCanvas` + `DrawToolbar` + `CommentInput` + `ErrorBanner` during `drawing` and `submitting`; renders `AnnotationThread` for each completed session; handles Escape key → appends `AnnotationCancelled` event (FR-017); shows `ClaudeUnavailableError` notice when `window.claude` is absent (FR-014); depends on T013, T014, T015, T016, T017, T018, T019, T020
- [x] T022 [US1] Create `packages/artifact-ai-draw-comments/src/auto-mount.tsx`: on `DOMContentLoaded` (or immediately if already fired), parse `document.getElementById("alistigo-config")` JSON for `drawComments.container` (default `"body"`); inject `<div id="ai-draw-comments-root">` as first child of resolved container; call `ReactDOM.createRoot(root).render(<App />)`; export `mount(container: HTMLElement)` and `unmount()`; depends on T021
- [x] T023 [US1] Create `packages/artifact-ai-draw-comments/src/index.tsx`: re-export `App` and `auto-mount` exports; expose `window.AiDrawComments = { mount, unmount, isReady }` where `isReady()` returns `typeof window.claude !== "undefined"`; depends on T022
- [x] T024 [US1] Create `packages/artifact-ai-draw-comments/vite.config.ts`: Vite config with `lib.entry = "src/index.tsx"`, `lib.formats = ["umd"]`, `lib.name = "AiDrawComments"`, `build.outDir = "dist"`, `build.rollupOptions.output.entryFileNames = "index.umd.js"`; React is bundled (not externalized); Tailwind v4 CSS plugin configured
- [x] T025 [US1] Create `packages/artifact-ai-draw-comments/src/styles/widget.css`: Tailwind v4 import + widget-scoped custom properties (overlay z-index above artifact content, crosshair cursor class, toolbar positioning, button styles); ensure the draw overlay does not alter opacity or visibility of content beneath it (SC-002)
- [x] T026 [US1] Add Nx targets to `packages/artifact-ai-draw-comments/project.json`: `build` (vite build), `typecheck` (tsc --noEmit), `lint` (biome check), `storybook` (storybook dev), `build-storybook` (storybook build); verify `nx run artifact-ai-draw-comments:build` produces `dist/index.umd.js`

**Checkpoint**: `nx run artifact-ai-draw-comments:build` succeeds; `nx run artifact-ai-draw-comments:storybook` builds without error; Quickstart Scenario 1 passes manually in Claude artifact playground

---

## Phase 4: User Story 2 — View Claude's Response (Priority: P2)

**Goal**: After sending a draw comment, Claude's response appears inline below the submitted annotation and comment, without navigation or reload. The "Draw Comment" button re-activates for a new cycle.

**Independent Test**: Follow `specs/001-ai-draw-comments/quickstart.md` Scenario 1 through to response display. Confirm: loading indicator appears after Send; response text appears below annotation PNG + comment; "Draw Comment" button re-activates; second annotation cycle can be started.

### Implementation for User Story 2

- [x] T027 [US2] Update `packages/artifact-ai-draw-comments/src/application/send-annotation.ts`: after `sendAnnotation` resolves, return the Claude response string; wire through App.tsx so the session transitions `sent → responded` with `claudeResponse` set (FR-011); depends on T013, T021
- [x] T028 [US2] Update `packages/artifact-ai-draw-comments/src/App.tsx`: when `claudeResponse` arrives on the active session, transition status from `sent` to `responded`; ensure `DrawCommentButton` re-activates (is no longer disabled) after `responded`; a new "Draw Comment" click creates a new `DrawCommentSession` and transitions to `selecting` (prior sessions remain in display thread read-only); depends on T021, T027
- [x] T029 [US2] Update `packages/artifact-ai-draw-comments/src/components/AnnotationThread.tsx`: confirm loading indicator (spinner or "Claude is thinking…") is shown when `session.status === "sent"` and `session.claudeResponse === null`; confirm response text renders once `session.claudeResponse` is set; annotated PNG and comment remain visible above the response (US2 scenario 2); depends on T020
- [x] T030 [US2] Update `packages/artifact-ai-draw-comments-features/step-definitions/`: add step implementations for `claude-response.feature` scenarios that drive `App` through the `sent → responded` transition; depends on T028

**Checkpoint**: Both US1 and US2 work sequentially in the playground; `nx run artifact-ai-draw-comments:build` still passes; `nx run artifact-ai-draw-comments:storybook` still builds

---

## Phase 5: User Story 3 — Embed in Host Artifact (Priority: P3)

**Goal**: A developer adds a single `<script>` tag to their Claude artifact and the "Draw Comment" button appears and works in their artifact. The selection and PNG capture cover the host artifact's content.

**Independent Test**: Follow `specs/001-ai-draw-comments/quickstart.md` Scenario 2 (Embedded — Button Appears in Host Artifact). Confirm: button appears at top of `#host-content`; PNG shows host text visible through transparent overlay; full send cycle works in embedded context.

### Implementation for User Story 3

- [x] T031 [US3] Update `packages/artifact-ai-draw-comments/src/auto-mount.tsx`: ensure robust parsing of `#alistigo-config` JSON (gracefully handle malformed JSON or missing `drawComments` key); verify selector resolution falls back to `document.body` when `container` is omitted or not found (FR-013, embed-api.md contract); depends on T022
- [x] T032 [US3] Update `packages/artifact-ai-draw-comments/src/index.tsx`: verify `window.AiDrawComments.mount(container)` is a no-op if already mounted; verify `unmount()` removes the root and cleans up all event listeners; verify `isReady()` returns `false` when `window.claude` is absent (embed-api.md imperative API contract); depends on T023
- [x] T033 [US3] Write `packages/artifact-ai-draw-comments-features/step-definitions/embed-host.steps.ts`: step implementations for `embed-host.feature` scenarios; test via JSDOM with a minimal host artifact DOM tree containing `#alistigo-config`; depends on T031, T032
- [x] T034 [US3] Update `packages/artifact-ai-draw-comments/vite.config.ts` if needed: confirm UMD bundle contains all required exports (`window.AiDrawComments`) and that `name: "AiDrawComments"` is correctly set; run `nx run artifact-ai-draw-comments:build` and verify bundle size ≤ 150 KB gzipped (target from embed-api.md); if Konva pushes the bundle over target, evaluate `konva/lib` tree-shaking options

**Checkpoint**: Quickstart Scenario 2 passes; bundle size verified; `nx run artifact-ai-draw-comments-features:test` passes for embed-host scenarios

---

## Phase 6: Skill Package

**Purpose**: Ship the agent skill so Claude can understand and invoke draw-comment capability in conversation.

- [ ] T035 Author `packages/artifact-ai-draw-comments-skill/SKILL.md`: define skill name `artifact-ai-draw-comments`, describe how Claude should suggest the widget to users who want to give visual feedback on artifacts, describe how to embed via `<script>` tag and the `window.AiDrawComments` API, include example invocations; add `packages/artifact-ai-draw-comments-skill/README.md`
- [ ] T036 Add Nx targets to `packages/artifact-ai-draw-comments-skill/project.json`: `lint` (biome check), `typecheck` (tsc --noEmit on any type declarations if present); verify `nx run artifact-ai-draw-comments-skill:lint` passes

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T037 [P] Update `packages/artifact-ai-draw-comments/README.md`: document embedding (single script tag, `#alistigo-config`), imperative API, `window.claude` requirement, and standalone usage; reference `specs/001-ai-draw-comments/contracts/embed-api.md`
- [ ] T038 [P] Add step definitions for `draw-comment-send.feature` scenarios in `packages/artifact-ai-draw-comments-features/step-definitions/draw-comment-send.steps.ts`; run `nx run artifact-ai-draw-comments-features:test` and ensure all P1 Gherkin scenarios pass
- [ ] T039 [P] Run Quickstart Scenario 3 (Send Failure Recovery, FR-016): stub `window.claude.complete` to reject; verify inline error appears, toolbar + Send re-enable, drawing + comment preserved; fix any bugs found
- [ ] T040 [P] Run Quickstart Scenario 4 (Cancel via Escape, FR-017): press Escape during selection and drawing; verify overlay dismisses, session discarded, button re-activates; fix any bugs found
- [ ] T041 [P] Run Quickstart Scenario 5 (`window.claude` Unavailable, FR-014): delete `window.claude`; verify button is visually disabled with tooltip/notice; fix any bugs found
- [ ] T042 Run full QA gate: `pnpm nx run holos:qa` — lint, typecheck, build, dead-code audit all pass for affected packages; fix any violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — T002, T003, T004 can run in parallel immediately; T001 must precede T012
- **Phase 2 (Foundational)**: T005–T008 depend on Phase 1 completion; T009–T011 (Gherkin) depend on Phase 1 and can run in parallel with T005–T008; T012–T013 depend on T001, T005–T008
- **Phase 3 (US1)**: All depend on Phase 2 completion; T014, T015, T017, T018 are parallel; T016, T019 depend on T007; T020 depends on T007; T021 integrates all components
- **Phase 4 (US2)**: Depends on Phase 3 (US1) checkpoint; T027–T030 extend existing files
- **Phase 5 (US3)**: Depends on Phase 3 (US1) checkpoint; T031–T034 extend auto-mount and embed contract
- **Phase 6 (Skill)**: Independent — can be authored any time after Phase 1
- **Phase 7 (Polish)**: Depends on all prior phases; T037–T041 parallelizable

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 — no dependency on US2/US3
- **US2 (P2)**: Depends on US1 checkpoint (extends App.tsx and send-annotation.ts)
- **US3 (P3)**: Depends on US1 checkpoint (extends auto-mount and index.tsx); independent of US2

### Within Each User Story

- Domain types before application layer before components
- Each component task includes its co-located Storybook story (constitution requirement)
- Gherkin feature files (T009–T011) must exist before step implementations (T030, T033, T038)

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 all in parallel
- **Phase 2**: T005–T008 can run while T009–T011 are written; T006, T007 parallel to each other
- **Phase 3**: T014, T015, T017, T018 all in parallel (different component files)
- **Phase 7**: T037–T041 all in parallel (different concerns, different files)

---

## Parallel Example: User Story 1 Setup

```bash
# Phase 1 — launch all scaffolding in parallel:
Task T002: Scaffold artifact-ai-draw-comments package
Task T003: Scaffold artifact-ai-draw-comments-skill package
Task T004: Scaffold artifact-ai-draw-comments-features package

# Phase 2 — domain types + Gherkin in parallel:
Task T006: shapes.ts
Task T007: session.ts
Task T009: draw-comment-send.feature
Task T010: claude-response.feature
Task T011: embed-host.feature

# Phase 3 — leaf components in parallel:
Task T014: DrawCommentButton + story
Task T015: ErrorBanner + story
Task T017: DrawToolbar + story
Task T018: CommentInput + story
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T013) — domain + Gherkin
3. Complete Phase 3: User Story 1 (T014–T026)
4. **STOP and VALIDATE**: Run Quickstart Scenario 1 manually
5. Deploy/demo the draw-comment-send cycle

### Incremental Delivery

1. Phase 1 + Phase 2 → Core types ready, Gherkin written
2. Phase 3 (US1) → Draw + Send working → MVP demo
3. Phase 4 (US2) → Response display → Full conversation loop
4. Phase 5 (US3) → Embeddable → Developer-facing release
5. Phase 6 (Skill) + Phase 7 (Polish) → Production-ready

---

## Notes

- `[P]` tasks operate on different files with no mutual dependencies
- `[Story]` label enables traceability to the spec user story
- Each component task includes its co-located `*.stories.tsx` file — this is a constitution gate (`qa:stories-check`)
- `window.htmlToImage` is a pre-loaded global — do NOT add `html-to-image` to `package.json`
- `window.claude.complete()` is the only Claude API method; the vision overload is added to `@alistigo/claude-artifact-api` in T001
- Do NOT modify anything in `packages/architecture/` — the CALM gate is N/A for this feature
- Bundle size target: ≤ 150 KB gzipped (verify in T034)
- Minimum selection size: 20×20 px (enforced in SelectionOverlay, T016)
