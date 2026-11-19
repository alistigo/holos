# alistigo-artifact-playground

The Alistigo iframe-embeddable base list app. Reads its document from an inline JSON-LD `<script>` tag, wires the document-editor to the components-react primitives, and ships a dev-only fixture picker for component review.

## Boot model

The app is a static bundle. On page load it:

1. Reads the JSON document from `<script type="application/json" id="alistigo-document">` in `index.html`.
2. Calls `createEditor(document)` from `@alistigo/core-document-editor` — the editor synthesizes a fresh event log if one isn't present (per `architecture.md` §5.1).
3. Wraps everything in `<AlistigoProvider editor={editor}>` and renders the components.

In tests, `driver-playwright` rewrites the `<script>` tag's content via `page.route()` to seed the scenario's fixture. The same code path serves both prod and tests — there is no test-only injection surface.

## Run it

```sh
nx run alistigo-artifact-playground:dev      # http://localhost:5173 — Vite dev server
nx run alistigo-artifact-playground:build    # production bundle in dist/
nx run alistigo-artifact-playground:preview  # serve the production build
```

## Opening the playground on a specific artifact

Two values can be set from the address, so a link can hand someone a reproduction
without them clicking through the form:

| Parameter | Sets | Accepts |
|---|---|---|
| `artifact` | the Artifact field | a full registry key (`@alistigo/artifact-list`), or any unambiguous short form of one (`artifact-list`, `list`) |
| `source` | the Source field | `dev` or `prod-local` (also `prod local`, `prod_local`). Development only — a production build does not render the field, so the parameter is ignored there |

```
http://localhost:5173/?artifact=list
http://localhost:5173/?artifact=ai-draw-comments&source=prod-local
http://localhost:5173/?artifact=@alistigo/artifact-claude-capabilities-demo
```

A value the playground does not offer is ignored rather than fatal: the saved or
default value is used and the form shows what it actually chose. The parameters
are read once, on load — change a field afterwards and your change stands; the
address will not pull it back. The playground never rewrites its own address, so
a shareable link is one you compose yourself.

## The form remembers itself

The left panel's Config tab is saved to `localStorage` whenever you change it and
restored on load, so a reload costs you nothing: artifact, source, AI context,
language, read-only, enabled plugins with their config, document fixture and raw
markdown, plus the published toggle.

- **One key**: `dev-playground:config:v1`, holding `{"v":1,"config":{…}}`. The
  prefix is deliberate — the Storage tab lists `alistigo`-prefixed keys as *the
  artifact's* storage, and the playground's own setup does not belong in that list.
- **Not saved**: the Claude Simulator's own controls (response delay, canned
  response, error and suppression modes), its log buffers, and which tab is open.
  Those are per-session tooling, not configuration injected into the artifact.
- **Clear Data does not reset it.** That button clears what the *artifact* stored;
  your form setup is written straight back afterwards. The preview iframe is
  same-origin, so "the artifact's storage" and the playground's are one area — the
  write-back is what keeps the two concerns separate.
- **To reset the form**, delete that key (DevTools → Application → Local Storage),
  or open the playground with the fields you want in the address.
- A saved setup naming an artifact, plugin or fixture that no longer exists falls
  back for *that field only* and keeps the rest. An unreadable or
  unrecognised-version entry is discarded whole and the playground opens on its
  defaults. With storage unavailable altogether — a private window — everything
  works, it just remembers nothing.

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
  ├─ createEditor(initialDocument)        ← @alistigo/core-document-editor
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
