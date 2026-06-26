# @alistigo/artifact-list

Self-contained UMD bundle for embedding the Alistigo list widget in Claude HTML artifacts or any web page. Bundles React, Lingui (English), and all Alistigo packages — no external dependencies required.

Auto-detects Claude artifact runtime and uses `window.storage` for persistence; falls back to `localStorage` elsewhere.

## Usage

### Auto-mount (default)

Include the script — the widget mounts itself at the end of `<body>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0.1.0/dist/index.umd.js"></script>
```

### Configure with a script tag

Place a JSON config tag **before** the bundle script to customise the widget:

```html
<script type="application/json" id="alistigo-config">
  { "container": "#app", "document": { ... } }
</script>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0.1.0/dist/index.umd.js"></script>

<div id="app"></div>
```

| Field | Type | Description |
|---|---|---|
| `container` | CSS selector | Target element. A `<div>` is appended to `<body>` if omitted. |
| `document` | `AlistigoDocument` | Pre-seeded list document. Defaults to an empty list. |

### Explicit mount (advanced)

For programmatic control, call `Alistigo.mount()` directly. **Do not mix with auto-mount** — combining the two creates two widget instances.

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@latest/dist/index.umd.js"></script>
<script>
  Alistigo.mount('#app', { document: myAlistigoDocument });
</script>
```

If `mount()` is called before the DOM is ready it will defer automatically — no manual `DOMContentLoaded` wrapping needed.

**Note:** Locale is baked at build time (English). The `locale` option has no effect at runtime.

## CSS bundling

The bundle includes all CSS — no separate stylesheet is needed.

**How it works:**
- Styling uses [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`.
- At build time, the Vite plugin scans every TypeScript/TSX source file reachable from the entry point, collects all Tailwind utility class names, and generates a CSS string containing only the classes actually used.
- Vite's `cssCodeSplit: false` option keeps that CSS inside the JS bundle instead of emitting a separate `.css` file. When the script executes, it injects a `<style>` tag into the page.
- Design tokens (Radix Colors scales, semantic colour variables) are defined in `@alistigo/list-components-react/src/styles/globals.css` and bundled the same way.

**Why not a separate CSS file?**

The primary target is Claude HTML artifacts, which run inside a sandboxed `<iframe>`. The iframe has no build pipeline and no way to load an external stylesheet that must stay version-locked to the script. A single `<script>` tag is the only reliable delivery mechanism. `cssCodeSplit: false` makes the bundle truly drop-in.

If you embed this bundle in a page that already uses Tailwind v4, there is no conflict — the injected styles are scope-independent utilities.

## Source structure

```
src/
  components/
    App.tsx       — root React component; default export App
    ListBody.tsx  — presentational list body; default export ListBody
  utils/
    container.ts  — resolveContainer, resolveAutoMountTarget (DOM helpers)
    document.ts   — makeDefaultDocument; default export; pure data factory
  auto-mount.ts   — autoMount; default export; AutoMountConfig type
  i18n.ts         — bootI18n; default export
  mount.ts        — mount; default export; MountOptions type
  index.tsx       — bundle entry; re-exports public API; fires DOMContentLoaded
  vite-env.d.ts   — Vite + Lingui virtual module type declarations
```

**Convention:** each non-entry file carries `export default` for its single primary export (the function or component that matches the file name). Files with two equally important public helpers (`container.ts`) use named exports only. The entry `index.tsx` does not follow this rule — it is a re-export barrel.
