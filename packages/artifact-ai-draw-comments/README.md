# @alistigo/artifact-ai-draw-comments

Embeddable Claude artifact widget for visual draw annotations. Users can select a region of the artifact, sketch shapes on a transparent overlay, attach a comment, and send the annotated screenshot to Claude — which then updates the artifact accordingly.

## Embedding (zero configuration)

Add a single `<script>` tag to your artifact. The widget auto-mounts and places a **Draw Comment** button at the top of the page.

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

## Embedding with an explicit container

```html
<div id="app">
  <!-- your artifact content -->
</div>

<script type="application/json" id="alistigo-config">
{ "drawComments": { "container": "#app" } }
</script>

<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

The widget reads `#alistigo-config` on load. `container` is a CSS selector; if it matches nothing the widget falls back to `document.body`.

## Imperative API (`window.AiDrawComments`)

The bundle exposes a global for programmatic control:

```typescript
// Mount into a specific element (no-op if already mounted)
window.AiDrawComments.mount(container: HTMLElement): void

// Unmount and remove all event listeners
window.AiDrawComments.unmount(): void

// Returns true when window.claude is present and the widget is fully operational
window.AiDrawComments.isReady(): boolean
```

## `window.claude` requirement

The widget requires the Claude artifact runtime API (`window.claude`) to send annotations. Inside a Claude artifact iframe this is provided automatically. Outside that environment (standalone dev server, unit tests) the button is rendered in a disabled state with a warning tooltip — no errors are thrown.

## Standalone usage

You can also import the React component tree directly:

```tsx
import { App } from "@alistigo/artifact-ai-draw-comments";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

## User flow

1. User clicks **Draw Comment** — cursor becomes a crosshair.
2. User drag-selects a rectangular region of the artifact.
3. A transparent canvas overlays the region; a toolbar offers **Rectangle** and **Line** tools.
4. User draws shapes (underlying content stays fully visible through the overlay).
5. User types an optional comment in the textarea.
6. User clicks **Send** — the widget:
   - Composites the drawn shapes over a screenshot of the selected region into a PNG.
   - Sends the PNG + comment to Claude via `window.claude.complete()`.
   - Switches the canvas to read-only mode.
7. Claude's response appears inline below the submitted annotation.
8. The **Draw Comment** button re-activates for a new cycle.

## Bundle size

≤ 150 KB gzipped (widget + React bundled; Konva tree-shaken to Rect + Line only).

## API contract

Full embedding contract: [`specs/001-ai-draw-comments/contracts/embed-api.md`](../../specs/001-ai-draw-comments/contracts/embed-api.md)
