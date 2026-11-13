# Contract: Embeddable Widget API

**Package**: `@alistigo/artifact-ai-draw-comments`
**Type**: UMD browser bundle, auto-mounting

---

## Embedding in a Host Artifact

### Minimal HTML (zero configuration)

```html
<!-- 1. Load the bundle (jsDelivr @0 major-version pin) -->
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>

<!-- The widget mounts automatically and injects the "Draw Comment" button
     into the top of <body> (or the container specified in #alistigo-config). -->
```

### With explicit container

```html
<div id="my-app">
  <!-- host artifact content here -->
</div>

<script type="application/json" id="alistigo-config">
{
  "drawComments": {
    "container": "#my-app"
  }
}
</script>

<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

The widget reads `#alistigo-config` on load and mounts the Draw Comment button at the top of `container`. If `container` is omitted or not found, it falls back to `document.body`.

---

## Auto-Mount Behaviour

On bundle load:
1. Wait for `DOMContentLoaded` (if not already fired).
2. Parse `#alistigo-config` → extract `drawComments.container` (optional).
3. Inject a `<div id="ai-draw-comments-root">` as the **first child** of the resolved container.
4. Mount the React widget tree into that root.
5. Detect `window.claude` availability; if absent, render the button in disabled state with a warning tooltip.

---

## JavaScript Imperative API (optional, advanced)

If the host needs programmatic control, the bundle exposes a global:

```typescript
window.AiDrawComments = {
  /**
   * Mount the widget into `container`.
   * No-op if already mounted.
   */
  mount(container: HTMLElement): void;

  /**
   * Unmount the widget and clean up all event listeners.
   */
  unmount(): void;

  /**
   * Returns true if window.claude is available and the widget is fully operational.
   */
  isReady(): boolean;
};
```

---

## Configuration Schema (`#alistigo-config` → `drawComments`)

```typescript
interface DrawCommentsConfig {
  /**
   * CSS selector for the container element.
   * Default: "body"
   */
  container?: string;
}
```

---

## Constraints

- The bundle does **not** polyfill `window.claude`; it only guards against its absence.
- The bundle does **not** persist any data; all session state is in-memory.
- The bundle has no peer-dependency requirements. React is bundled (not externalized) since the widget is designed for host artifacts that may not use React.
- Bundle size target: ≤ 150 KB gzipped (widget + React + html2canvas).
