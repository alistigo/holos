# Skill: artifact-ai-draw-comments

**Package**: `@alistigo/artifact-ai-draw-comments-skill`
**Skill name**: `artifact-ai-draw-comments`

---

## Purpose

This skill teaches Claude when and how to embed the **AI Draw Comments** widget into an artifact.

The widget lets users annotate any part of an artifact with freehand drawings and attach a written comment. When the user sends the annotation, the widget captures a PNG of the annotated region and delivers it back to Claude via `window.claude.sendMessage`, so Claude can act on the visual feedback and update the artifact accordingly.

---

## When to Suggest This Widget

Suggest embedding the AI Draw Comments widget when the user:

- Asks how to give visual feedback on an artifact (e.g., "how can I point at a specific part of this chart?")
- Says they want to annotate, draw on, or mark up something inside the artifact
- Uses phrases like "can you see what I mean if I show you?", "let me sketch that for you", or "I want to highlight a region"
- Is iterating on a visual or interactive artifact and verbal descriptions alone are ambiguous

Do **not** suggest the widget for purely text-based artifacts (plain prose, code snippets) where selection and quoting suffice.

---

## How to Embed the Widget

### Minimal embedding (zero configuration)

Add a single `<script>` tag at the end of `<body>`. The widget auto-mounts and injects a "Draw Comment" button at the top of the page.

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

### With explicit container

If the artifact has a specific root element, tell the widget which element to anchor to:

```html
<div id="app">
  <!-- artifact content -->
</div>

<script type="application/json" id="alistigo-config">
{
  "drawComments": {
    "container": "#app"
  }
}
</script>

<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

The `container` value is a CSS selector. If the selector matches nothing, the widget falls back to `document.body`.

---

## Auto-Mount Behaviour

The bundle self-initialises on load:

1. Waits for `DOMContentLoaded` (skipped if the DOM is already ready).
2. Reads `#alistigo-config` → `drawComments.container` (optional).
3. Inserts `<div id="ai-draw-comments-root">` as the first child of the resolved container.
4. Mounts the React widget tree into that root.
5. Checks for `window.claude`; if absent, renders the button in a disabled state with a warning tooltip.

---

## Imperative API (`window.AiDrawComments`)

For advanced use cases the host artifact can call the API directly:

```typescript
window.AiDrawComments.mount(container: HTMLElement): void   // mount into an element (no-op if already mounted)
window.AiDrawComments.unmount(): void                        // tear down and remove all event listeners
window.AiDrawComments.isReady(): boolean                     // true when window.claude is available
```

---

## User Flow Inside the Widget

1. User clicks the **Draw Comment** button at the top of the artifact.
2. A crosshair cursor appears; the user drags to select a rectangular region.
3. A transparent canvas overlays the selected region.
4. The toolbar offers two drawing tools: **Rectangle** and **Line**.
5. The user draws shapes on the canvas (the content underneath remains visible).
6. The user types an optional comment in the text area below the canvas.
7. The user clicks **Send**.
8. The widget:
   a. Captures a PNG of the annotated region (canvas drawings composited over the content).
   b. Sends the PNG + comment to Claude via `window.claude.sendMessage`.
   c. Switches to read-only mode showing the submitted annotation.
9. Claude receives the annotated PNG and updates the artifact accordingly.

---

## Example: React artifact with the widget embedded

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>My Chart</title>
</head>
<body>
  <div id="app">
    <!-- React app rendered here by artifact runtime -->
  </div>

  <script type="application/json" id="alistigo-config">
  { "drawComments": { "container": "#app" } }
  </script>

  <!-- AI Draw Comments — auto-mounts the annotation button -->
  <script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
</body>
</html>
```

---

## Constraints

- Requires `window.claude` (the Claude artifact runtime API) to send annotations. The button is visible but disabled when absent.
- All session state is in-memory; the widget does not persist anything.
- React is bundled inside the UMD — no peer-dependency requirements on the host.
- Bundle size: ≤ 150 KB gzipped.
