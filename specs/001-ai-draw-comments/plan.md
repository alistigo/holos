# Implementation Plan: AI Draw Comments

**Branch**: `feat/001-ai-draw-comments` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ai-draw-comments/spec.md`

---

## Summary

Add a visual annotation widget (`@alistigo/artifact-ai-draw-comments`) that embeds into any Claude artifact or runs standalone. Users select a region, draw rectangles or lines over it, add an optional comment, and send the composite PNG to Claude via `window.claude.complete()`. An accompanying skill package (`@alistigo/artifact-ai-draw-comments-skill`) exposes the capability to Claude as a conversation-level skill.

Technical approach: React + Konva for the drawing overlay; `html-to-image` (pre-loaded global in every Claude artifact — zero added dependency) for DOM capture; a vision overload added to `@alistigo/claude-artifact-api`; UMD bundle auto-mounts via the `auto-mount` pattern from the capabilities demo.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode; `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)

**Primary Dependencies**:
- React 18 (bundled in UMD — not externalized, as hosts may not use React)
- `konva` + `react-konva` — drawing canvas (rectangles, lines); Konva Stage/Layer managed by React
- `html-to-image` — DOM capture; **NOT** installed as a package dependency — it is pre-loaded as a global (`window.htmlToImage`) in every Claude artifact iframe; a type-only declaration is added in `src/globals.d.ts`
- `@alistigo/claude-artifact-api` (workspace:*) — `window.claude` types + `artifactContext()`
- `@alistigo/artifact-core-components-react` (workspace:*) — shared UI primitives if available
- Tailwind CSS v4 + Radix Colors — styling (per constitution ADR-0001)
- Vite — build tooling (UMD output)

**Storage**: None — all state is session-scoped and in-memory

**Testing**: Vitest (unit), Playwright (Gherkin bridge), Storybook 8 (component stories)

**Target Platform**: Claude artifact iframe (`claudeusercontent.com`); same-origin DOM access; no Node.js runtime

**Performance Goals**: PNG generated and transmitted within 3 seconds of "Send" click (SC-003); button-to-first-shape within 30 seconds for first-time users (SC-001)

**Constraints**: Bundle ≤ 150 KB gzipped; no cross-origin iframe capture; `window.claude` must be present for Send to function

**Scale/Scope**: Single-user, session-scoped; no server, no database; two packages + one features package

---

## Constitution Check

*GATE: Must pass before Phase 0 research. ✅ All gates pass.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Package-First | Every deliverable is a workspace package under `packages/` | ✅ PASS | Three new packages: main widget, skill, features |
| I. Package-First | Each package has `package.json` (scoped `@alistigo/`), `project.json`, `README.md`, `LICENSE` | ✅ PASS | Scaffolded via `new-package.sh` |
| I. Package-First | Cross-package imports via `workspace:*` | ✅ PASS | `artifact-ai-draw-comments` → `claude-artifact-api` via `workspace:*` |
| II. Platform Architecture | Artifact Contract (loading screen, badge, config-doc, etc.) | ✅ JUSTIFIED | Explicitly waived in clarification Q2 — lightweight plugin, not a full artifact |
| II. Platform Architecture | `"alistigo": { "type": "..." }` in package.json | ✅ PASS | Main widget = `application`; skill = `skill` |
| III. DDD + Event Sourcing | Domain layer has zero external imports | ✅ PASS | `DrawCommentSession` state machine is pure logic; no DOM/IO imports |
| III. DDD + Event Sourcing | No persistence → event store not applicable | ✅ PASS | Explicitly session-scoped |
| IV. TDD via Gherkin | Behavior specified in `.feature` files before implementation | ✅ PASS | `artifact-ai-draw-comments-features` package required (see Project Structure) |
| IV. TDD via Gherkin | Every React component has a co-located Storybook story | ✅ PASS | Enforced by `qa:stories-check`; must be authored before implementation |
| V. Architecture as Code | CALM — no new architectural boundaries introduced | ✅ N/A | This feature adds packages within existing boundaries; no `packages/architecture/` changes required |

**No violations.** No Complexity Tracking table required.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-draw-comments/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── embed-api.md     ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — NOT yet created)
```

### Source Code (repository root)

```text
packages/
├── artifact-ai-draw-comments/          @alistigo/artifact-ai-draw-comments  (application)
│   ├── src/
│   │   ├── index.tsx                   — UMD entry; re-exports App + auto-mount
│   │   ├── auto-mount.tsx              — DOMContentLoaded listener; mounts React
│   │   ├── globals.d.ts                — type declaration for window.htmlToImage global
│   │   ├── App.tsx                     — root component; session list + Draw Comment button
│   │   ├── components/
│   │   │   ├── DrawCommentButton.tsx   — persistent top button (+ Storybook story)
│   │   │   ├── SelectionOverlay.tsx    — crosshair + drag-select UI (+ story)
│   │   │   ├── DrawCanvas.tsx          — Konva Stage/Layer overlay + toolbar (+ story)
│   │   │   ├── DrawToolbar.tsx         — rectangle / line tool selector (+ story)
│   │   │   ├── CommentInput.tsx        — textarea + Send button (+ story)
│   │   │   ├── AnnotationThread.tsx    — read-only annotation + response display (+ story)
│   │   │   └── ErrorBanner.tsx         — inline send-failure message (+ story)
│   │   ├── domain/
│   │   │   ├── session.ts              — DrawCommentSession, state machine, transitions
│   │   │   ├── shapes.ts               — DrawShape type (Konva-compatible coords)
│   │   │   └── snapshot.ts             — AnnotatedSnapshot builder (html-to-image capture + Konva export composite)
│   │   ├── application/
│   │   │   ├── send-annotation.ts      — orchestrates capture → composite → complete()
│   │   │   └── claude-bridge.ts        — wraps window.claude.complete() with vision overload
│   │   └── styles/
│   │       └── widget.css              — Tailwind v4 widget styles
│   ├── package.json
│   ├── project.json
│   ├── tsconfig.json
│   ├── vite.config.ts                  — UMD output: dist/index.umd.js
│   ├── README.md
│   └── LICENSE
│
├── artifact-ai-draw-comments-skill/    @alistigo/artifact-ai-draw-comments-skill  (skill)
│   ├── SKILL.md                        — Claude skill definition
│   ├── package.json
│   ├── project.json
│   ├── README.md
│   └── LICENSE
│
├── artifact-ai-draw-comments-features/ @alistigo/artifact-ai-draw-comments-features
│   ├── features/
│   │   ├── draw-comment-send.feature   — P1 scenarios (annotation + send)
│   │   ├── claude-response.feature     — P2 scenarios (response display)
│   │   └── embed-host.feature          — P3 scenarios (embedded in host)
│   ├── step-definitions/               — Application-layer step implementations
│   ├── package.json
│   ├── project.json
│   └── README.md
│
└── claude-artifact-api/                @alistigo/claude-artifact-api  (existing — MODIFIED)
    └── src/
        └── index.ts                    — Add ClaudeMessageContent + vision overload to ClaudeApi
```

**Structure Decision**: Three-package approach mirroring the `artifact-claude-capabilities-demo` pattern. DDD layering is applied within the main package (`domain/` → pure logic, `application/` → orchestration, `components/` → presentation).

---

## Implementation Sequence

The following order ensures tests exist before implementation and respects constitution principle ordering:

1. **Extend `claude-artifact-api`** — Add `ClaudeMessageContent` type and vision overload to `ClaudeApi`
2. **Scaffold packages** — `new-package.sh` for all three packages; set `"alistigo"` type fields (`application` / `skill`)
3. **Add `globals.d.ts`** — Declare `window.htmlToImage` type (from the pre-loaded `html-to-image` global); no npm install
4. **Gherkin features** — Write `.feature` files in `artifact-ai-draw-comments-features` before any domain code
5. **Domain layer** — `session.ts`, `shapes.ts`, `snapshot.ts` (pure, no DOM)
6. **Application layer** — `claude-bridge.ts`, `send-annotation.ts`
7. **Components + Stories** — Each component authored with its Storybook story; `DrawCanvas.tsx` uses `react-konva`
8. **Auto-mount + UMD build** — `auto-mount.tsx`, `index.tsx`, `vite.config.ts`
9. **Skill package** — `SKILL.md` authored
10. **QA gate pass** — `pnpm qa` green; Gherkin scenarios green; Storybook builds
