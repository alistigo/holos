# Quickstart Validation Guide: AI Draw Comments

**Date**: 2026-11-13 | **Feature**: [spec.md](./spec.md)

---

## Prerequisites

- The `@alistigo/artifact-ai-draw-comments` package is built (`nx run artifact-ai-draw-comments:build`)
- A Claude artifact is open in the browser (or the alistigo-artifact-playground is running)
- `window.claude` is available (confirmed by `typeof window.claude !== "undefined"` in the browser console)

---

## Scenario 1: Standalone — Full Draw-Comment-Send Cycle (P1)

**Goal**: Validate the core flow end-to-end in the standalone demo shell.

**Setup**: Open the standalone artifact (load `dist/index.umd.js` as a Claude artifact, or use the playground).

**Steps**:
1. Confirm the "Draw Comment" button is visible at the top of the artifact.
2. Click "Draw Comment" — cursor should change to a crosshair.
3. Click-drag to select a rectangular region (at least 50×50 px).
4. Confirm a transparent canvas overlay appears over the selection, with a toolbar (rectangle + line tools) and a comment textarea below.
5. Select the rectangle tool and draw a rectangle on the canvas.
6. Type a comment: `"Testing annotation"`.
7. Click "Send".

**Expected outcomes**:
- Steps 2–4 complete within 2 seconds.
- The "Send" button was enabled after step 5 (shape drawn).
- After step 7: the canvas switches to read-only, toolbar and textarea disappear, the drawn shapes remain visible.
- A loading indicator appears below the annotation.
- Claude's response appears below the annotation within a few seconds.
- The "Draw Comment" button re-activates after the response arrives.

---

## Scenario 2: Embedded — Button Appears in Host Artifact (P3)

**Setup**: Create a minimal Claude artifact containing:
```html
<div id="host-content"><p>Hello from host artifact.</p></div>
<script type="application/json" id="alistigo-config">{"drawComments":{"container":"#host-content"}}</script>
<script src="[jsDelivr URL for @alistigo/artifact-ai-draw-comments@0]"></script>
```

**Steps**:
1. Open the artifact in Claude.
2. Confirm the "Draw Comment" button appears at the top of `#host-content`.
3. Click the button and select the "Hello from host artifact." text region.
4. Draw a line on the overlay.
5. Click Send (no comment text needed).

**Expected outcomes**:
- Button is visible immediately on load.
- The overlay captures the host content (the `<p>` text is visible through the transparent canvas).
- The generated PNG (visible in the annotation read-only view) shows both the host text and the drawn line.

---

## Scenario 3: Send Failure Recovery (FR-016)

**Setup**: Before mounting, replace `window.claude.complete` with a stub that rejects:
```js
window.claude = { complete: () => Promise.reject(new Error("Simulated failure")) };
```

**Steps**:
1. Perform a draw + comment.
2. Click "Send".

**Expected outcomes**:
- An inline error message appears below the canvas (not a toast, not a modal).
- The drawing toolbar and "Send" button re-enable.
- The drawn shapes and comment text are preserved.
- The user can click "Send" again (which would fail again with the stub in place, confirming the retry loop works).

---

## Scenario 4: Cancel via Escape (FR-017)

**Steps**:
1. Click "Draw Comment" and select a region.
2. Draw a shape on the canvas.
3. Press Escape.

**Expected outcomes**:
- The overlay and toolbar disappear immediately.
3. The artifact returns to the idle state; the "Draw Comment" button is active again.
- No annotation is sent; no session is recorded.

---

## Scenario 5: window.claude Unavailable (FR-014)

**Setup**: Remove `window.claude` before loading: `delete window.claude`.

**Steps**:
1. Load the standalone artifact.

**Expected outcomes**:
- The "Draw Comment" button is visible but visually disabled (grayed or tooltip-annotated).
- A notice is displayed (e.g., "Draw comments require a Claude artifact environment").
- Clicking the button does nothing.

---

## Build & Type Checks

```sh
# Build both packages
nx run artifact-ai-draw-comments:build
nx run artifact-ai-draw-comments-skill:build

# Type-check
nx run artifact-ai-draw-comments:typecheck
nx run artifact-ai-draw-comments-skill:typecheck

# Lint
nx run artifact-ai-draw-comments:lint
nx run artifact-ai-draw-comments-skill:lint

# Run Gherkin feature scenarios (Application runner)
nx run artifact-ai-draw-comments-features:test

# Run Storybook for visual component review
nx run artifact-ai-draw-comments:storybook
```
