# Research: AI Draw Comments

**Date**: 2026-11-13 | **Feature**: [spec.md](./spec.md)

---

## Decision 1: window.claude API — Image Submission

**Finding**: The `@alistigo/claude-artifact-api` package (`packages/claude-artifact-api/src/index.ts`) defines:

```typescript
export interface ClaudeApi {
  complete(prompt: string): Promise<string>;
}
```

The `window.claude.sendMessage()` method assumed in the clarification session does **not** exist. The actual call is `window.claude.complete()`.

**Decision**: Extend `ClaudeApi` in `@alistigo/claude-artifact-api` to add an overload that accepts an array of multi-modal content blocks:

```typescript
export type ClaudeMessageContent =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } };

export interface ClaudeApi {
  complete(prompt: string): Promise<string>;
  complete(content: ClaudeMessageContent[]): Promise<string>;
}
```

**Rationale**: The underlying Claude model is vision-capable. The existing type definition is acknowledged as "reverse-engineered from live Claude sessions" and is therefore incomplete. Adding a vision overload follows the Anthropic API's multi-content-block pattern exactly. The implementation calls `window.claude.complete()` with the array; if the runtime does not support it, it throws and the FR-016 retry path handles recovery.

**Alternatives considered**:
- Text-only encoding (embed base64 string in prompt) — rejected: Claude cannot interpret raw base64 as an image; would produce garbled responses.
- Separate image upload before `complete()` — rejected: no file upload API exists in the Claude iframe API.
- Send annotation metadata (coordinates only, no screenshot) — rejected: loses the core value proposition of a visual annotation.

**Spec impact**: FR-009 updated to reflect `window.claude.complete([imageBlock, textBlock])`.

---

## Decision 2: DOM-to-Canvas Capture Strategy

**Decision**: Use `html-to-image` for DOM capture. This library is **pre-loaded as a global** (`window.htmlToImage`) in every Claude artifact iframe at:
```
https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js
```
No npm dependency is required. A type-only declaration in `src/globals.d.ts` provides TypeScript safety:
```typescript
declare global {
  interface Window {
    htmlToImage: typeof import("html-to-image");
  }
}
```

**Rationale**: `html-to-image` is already available in the artifact iframe environment — zero bundle weight added. Since widget and host content share the same iframe origin (`claudeusercontent.com`), no CORS issues arise. Using `window.htmlToImage.toPng(element)` on the selected region produces a PNG data URL directly.

**Alternatives considered**:
- Installing `html-to-image` as an npm package — rejected: redundant since the library is already globally available; would add to bundle size unnecessarily.
- `html2canvas` — rejected: not pre-loaded in Claude artifact iframes; would require an npm dependency.
- `getDisplayMedia()` (Screen Capture API) — requires explicit user permission dialog; too disruptive for an annotation flow.

**Limitation**: Does not capture cross-origin iframes nested inside the target region. For v1, this is acceptable per the spec assumption that cross-origin content is out of scope.

---

## Decision 3: Package Structure (Three Packages)

**Decision**: Three workspace packages:

| Package | Name | Type |
|---------|------|------|
| `packages/artifact-ai-draw-comments/` | `@alistigo/artifact-ai-draw-comments` | `application` |
| `packages/artifact-ai-draw-comments-skill/` | `@alistigo/artifact-ai-draw-comments-skill` | `skill` |
| `packages/artifact-ai-draw-comments-features/` | `@alistigo/artifact-ai-draw-comments-features` | _(Gherkin)_ |

**Rationale**: Mirrors the established pattern of `artifact-claude-capabilities-demo` + `artifact-claude-capabilities-demo-skill`. The main package is typed `application` — this is a fully-fledged application that happens to be embeddable in other artifacts. In Alistigo terminology, `application` is the correct type even though the deployment pattern is plugin-like; the widget does not implement the full Artifact Contract but it is a React application, not a plug-in extension. The skill package contains only `SKILL.md` + package metadata (no `src/`), mirroring the demo skill. The features package holds Gherkin `.feature` files per the constitution (Principle IV).

**Alternatives considered**:
- `"alistigo": { "type": "plugin" }` — rejected: "plugin" is not the correct Alistigo type; "application" is the right term for a React app even when used as an embeddable widget.
- Single package with skill embedded — rejected: skill packages are independently versioned and publishable; mixing them breaks the two-tier release model.
- `"presentation"` type — rejected: does not reflect the standalone + embeddable dual-mode nature of the widget.

---

## Decision 4: Drawing Canvas Implementation

**Decision**: Use **Konva** (`konva` + `react-konva`) for the drawing overlay. The `DrawCanvas` component wraps a Konva `Stage` and `Layer` positioned absolutely over the selected DOM region.

**Rationale**: Konva provides a React-friendly declarative API for canvas shapes (rectangles, lines) that integrates naturally with the React component tree. Shape state (coordinates, type) maps cleanly onto the `DrawShape[]` domain model. Exporting the composite PNG is straightforward: `stage.toDataURL()` produces the shapes layer, which is then composited with the `html-to-image` DOM capture. Konva also simplifies future shape interactions (hover, selection, undo) if added in a later version.

**How transparency is achieved**: The Konva `Stage` background is transparent (`listening={false}` on the background); only the drawn shapes (rectangles, lines) are rendered on the canvas layer. The underlying artifact content shows through.

**PNG export flow**:
1. `window.htmlToImage.toPng(regionElement)` → base64 DOM snapshot
2. `konvaStage.toDataURL()` → base64 shapes layer (transparent background)
3. Composite: draw DOM snapshot on an offscreen canvas, then draw the Konva layer on top
4. `offscreenCanvas.toDataURL('image/png')` → final `AnnotatedSnapshot.pngBase64`

**Alternatives considered**:
- Native HTML5 Canvas 2D API — rejected: imperative, requires manual hit-testing and shape tracking; more code for no meaningful bundle savings given Konva's efficiency.
- SVG overlay — equivalent capability; Konva chosen because `stage.toDataURL()` avoids SVG-to-raster conversion and integrates with the React render cycle.
- Fabric.js — rejected: larger bundle than Konva; Konva's React bindings (`react-konva`) are a better fit for this component architecture.

---

## Decision 5: Standalone Demo Shell

**Decision**: The standalone artifact ships as a single self-contained HTML artifact (the main UMD bundle) that renders a demo "host" UI (a sample list or text block) with the draw-comment button already attached.

**Rationale**: The spec requires the tool to "run as a standalone artifact" (FR-012) without a full Alistigo Artifact Contract. The demo shell follows the same `auto-mount.tsx` pattern as `artifact-claude-capabilities-demo`, parsing an `#alistigo-config` JSON element and mounting React into a container div.

---

## Decision 6: claude-artifact-api — TypeID for AnnotatedSnapshot

**Decision**: `AnnotatedSnapshot` does not receive a TypeID prefix because it is an in-memory, transient object that is never persisted or referenced by ID elsewhere. ADR-0023 (TypeID for entity IDs) applies to persisted domain entities; session-scoped transient objects are out of scope.
