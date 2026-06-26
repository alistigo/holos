# alistigo-artifact-playground

The Alistigo iframe-embeddable base list app. Reads its document from an inline JSON-LD `<script>` tag, wires the document-editor to the components-react primitives, and ships a dev-only fixture picker for component review.

## Boot model

The app is a static bundle. On page load it:

1. Reads the JSON document from `<script type="application/json" id="alistigo-document">` in `index.html`.
2. Calls `createEditor(document)` from `@alistigo/document-editor` — the editor synthesizes a fresh event log if one isn't present (per `architecture.md` §5.1).
3. Wraps everything in `<AlistigoProvider editor={editor}>` and renders the components.

In tests, `driver-playwright` rewrites the `<script>` tag's content via `page.route()` to seed the scenario's fixture. The same code path serves both prod and tests — there is no test-only injection surface.

## Run it

```sh
nx run alistigo-artifact-playground:dev      # http://localhost:5173 — Vite dev server
nx run alistigo-artifact-playground:build    # production bundle in dist/
nx run alistigo-artifact-playground:preview  # serve the production build
```

## Dev fixture picker

In dev mode (`import.meta.env.DEV === true`) a small overlay in the top-right lets you swap the editor's document on the fly. It's populated from `fixtures/*.json` via Vite's `import.meta.glob`. The overlay is dropped from production builds at tree-shake time.

Adding a fixture:

```sh
# Drop a new JSON file into fixtures/ — it appears in the picker on next reload.
cp fixtures/empty.json fixtures/my-list.json
```

Each fixture is a complete `AlistigoDocument` (meta + projection, eventLog optional). The editor synthesizes an event log on bootstrap.

## Architecture

```
index.html (inline <script id="alistigo-document">)
       │
       ▼
src/boot.ts ─── parses JSON ───► AlistigoDocument
       │
       ▼
src/main.tsx  → createRoot → <App initialDocument={…} />
       │
       ▼
src/App.tsx
  ├─ createEditor(initialDocument)        ← @alistigo/document-editor
  ├─ <AlistigoProvider editor>            ← @alistigo/list-components-react
  ├─ <AlistigoApp>
  │     <h1>{name}</h1>
  │     <AddElementInput onAdd={…} />
  │     <ListView projection onDelete={…} />
  │   </AlistigoApp>
  └─ <DevFixturePicker /> (dev only)
```

The app contains no domain logic. Commands flow `AddElementInput → useAlistigoActions → editor.dispatch`, the editor folds events into a new document, the context notifies subscribers, components re-render. Same loop for delete.

## What's deferred

- **Persistence** — `LocalStorageEventStore` adapter listed in `projects/alistigo-ai/plan.md`, lands next.
- **Styling** — components are intentionally unstyled; that's the test-friendly path. Styling lands once we settle which CSS approach this repo uses.
- **Host protocol** — M4 (`postMessage`).
