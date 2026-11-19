# alistigo-artifact-playground

The dev host for Alistigo artifacts. It is **not** an artifact itself: it is the page you open to
run one, configured through a form, rendered in an iframe that imitates the sandbox a real Claude
artifact runs inside, with the host capabilities that artifact expects simulated around it.

It is also the host the Gherkin end-to-end suites drive, so its chrome is a test contract as much
as a developer tool — see [Driving it from tests](#driving-it-from-tests).

## Boot model

Two independent entry points, which is the thing to understand before anything else here makes
sense.

**The host page** — `index.html` → `src/host.tsx` → `<HostPage />`. A plain Vite SPA. It owns the
form, builds the document the preview iframe runs, and simulates the AI host.

**The artifact** — runs inside the iframe, from a document the host page *builds as a string* and
hands over as `srcdoc`. It is never served from disk. `buildIframeSrcdoc.ts` assembles it:

```
<!DOCTYPE html>                                 ─┐
  console shim, CSP, charset, title              │ "playground" — host scaffolding
  plugin URL overrides, React-refresh preamble   │
  the draw-comments host surface                ─┘
  html-to-image + claude-artifact-api bridge     ─ "ai-bridge"  — what the AI chat injects
  <script id="alistigo-config">{…}</script>      ─ "config"     — what the artifact reads
  <script id="ai-input-action">…</script>        ─ "ai-input"   — the markdown handed to it
  <script type="module" src="…">                 ─ "artifact"   — loads the artifact
```

Those five names are segments, and they are what the preview panel's tabs show one of each. The
builder returns the document as an ordered list of tagged parts rather than one template string, so
the whole document is the parts joined and each tab is one segment's — "Source is the merge of the
other tabs" holds by construction instead of by hand. `src/buildIframeSrcdoc.test.ts` asserts both
that property and that the assembled bytes have not moved.

Where the artifact's bundle comes from depends on the **Source** field (dev only):

| Source | The iframe loads | Use it for |
|---|---|---|
| `dev` | `src/artifact-entry.tsx`, served by Vite from workspace source | HMR, and the only mode that exercises each artifact's own Lingui catalogue |
| `prod local` | `/__local-dist/<name>/index.js`, the local `dist/` build via a dev-server middleware | what a published bundle will actually do, without publishing |
| *(production build)* | the artifact's `cdnUrl` from `ARTIFACT_REGISTRY` | `preview`, GitHub Pages, and what the e2e suites assert against (route-intercepted to serve local `dist/`) |

`src/artifact-entry.tsx` exists only in dev: it reads `#alistigo-config` and dynamically imports the
chosen artifact. A production build never uses it, which is why anything the artifact needs *around*
it — the draw-comments host surface, for instance — lives in the srcdoc builder instead.

## Run it

```sh
nx run alistigo-artifact-playground:dev        # http://localhost:5173 — Vite dev server
nx run alistigo-artifact-playground:dev:debug  # same, with VITE_ALISTIGO_DEBUG=true
nx run alistigo-artifact-playground:build      # production bundle in dist/en
nx run alistigo-artifact-playground:build:fr   # the French locale, in dist/fr
nx run alistigo-artifact-playground:preview    # serve the production build on :4173
nx run alistigo-artifact-playground:test       # unit tests + fixture validation
```

Locales are separate static bundles, selected at build time by `LOCALE` (Lingui v6, per ADR-0001 —
there is no runtime locale switching inside a bundle). `dev:umd` serves `index.umd.html` instead: a
bare page that loads the built bundle from `/index.umd.js` and auto-mounts from an inline
`#alistigo-config`, for checking the published artefact without the host page around it.

## The two panels

**Left — the form.** Two tabs:

- **Config**, in three sections: *Playground config* (Source, AI Context), *Global artifact config*
  (Artifact, Language, Read-only) and *Artifact config* (plugins with their JSON config, and the AI
  input document). This is what [the form remembers](#the-form-remembers-itself).
- **Claude Simulator**, present only when AI Context is `claude`: the host capabilities an artifact
  expects, each with a live log — storage (private and shared), `complete` (canned responses, error
  modes, delay), proxied `fetch`, downloads, and navigation. Plus the Published toggle and *Clear data*.

**Right — the preview.** Seven tabs: **App** (the live iframe), **Source** (the whole injected
document), then the three segment views — **AI Bridge**, **Artifact source**, **Playground
source** — and **Config** and **AI Input**, which show their own segment as readable structure and
plain markdown rather than markup. The iframe stays mounted while you are on another tab, so
switching away and back does not restart the artifact.

## Opening the playground on a specific artifact

Two values can be set from the address, so a link can hand someone a reproduction without them
clicking through the form:

| Parameter | Sets | Accepts |
|---|---|---|
| `artifact` | the Artifact field | a full registry key (`@alistigo/artifact-list`), or any unambiguous short form of one (`artifact-list`, `list`) |
| `source` | the Source field | `dev` or `prod-local` (also `prod local`, `prod_local`). Development only — a production build does not render the field, so the parameter is ignored there |

```
http://localhost:5173/?artifact=list
http://localhost:5173/?artifact=ai-draw-comments&source=prod-local
http://localhost:5173/?artifact=@alistigo/artifact-claude-capabilities-demo
```

A value the playground does not offer is ignored rather than fatal: the saved or default value is
used and the form shows what it actually chose. The parameters are read once, on load — change a
field afterwards and your change stands; the address will not pull it back. The playground never
rewrites its own address, so a shareable link is one you compose yourself.

## The form remembers itself

The left panel's Config tab is saved to `localStorage` whenever you change it and restored on load,
so a reload costs you nothing: artifact, source, AI context, language, read-only, enabled plugins
with their config, document fixture and raw markdown, plus the published toggle.

- **One key**: `dev-playground:config:v1`, holding `{"v":1,"config":{…}}`. The prefix is deliberate
  — the Storage tab lists `alistigo`-prefixed keys as *the artifact's* storage, and the playground's
  own setup does not belong in that list.
- **Not saved**: the Claude Simulator's own controls (response delay, canned response, error and
  suppression modes), its log buffers, and which tab is open. Those are per-session tooling, not
  configuration injected into the artifact.
- **Clear data does not reset it.** That button clears what the *artifact* stored; your form setup
  is written straight back afterwards. The preview iframe is same-origin, so "the artifact's
  storage" and the playground's are one area — the write-back is what keeps the two concerns
  separate.
- **To reset the form**, delete that key (DevTools → Application → Local Storage), or open the
  playground with the fields you want in the address.
- A saved setup naming an artifact, plugin or fixture that no longer exists falls back for *that
  field only* and keeps the rest. An unreadable or unrecognised-version entry is discarded whole and
  the playground opens on its defaults. With storage unavailable altogether — a private window —
  everything works, it just remembers nothing.

## AI input fixtures

The *AI Input* field feeds the artifact a document the way an AI chat would: as markdown in a
`<script id="ai-input-action" type="text/markdown">` tag, which is the artifact's own parsing path,
not a test-only injection surface. Options are `fixtures/*.md`, collected by `import.meta.glob`,
plus *enter markdown* for typing one inline and *none* for booting empty.

```sh
# Drop a markdown file into fixtures/ — it appears in the picker on next reload.
cp fixtures/groceries.md fixtures/my-list.md
```

`nx run alistigo-artifact-playground:test` validates every fixture through
`@alistigo/core-document-validator`, so a malformed one fails the build rather than the scenario
that happens to pick it.

## Driving it from tests

The Gherkin suites (`@alistigo/list-features`,
`@alistigo/artifact-ai-draw-comments-features`) run against `vite preview` through
`@alistigo/artifact-features-runner-playwright`, whose `PlaygroundPage` owns every playground
selector. A few pieces of this app's chrome are therefore load-bearing for tests:

- the **`Artifact` combobox** — how a scenario selects its artifact, and how `doctor` decides the
  host really is the playground;
- `#alistigo-config` **inside the iframe** — how the harness confirms a selection reached the
  artifact, rather than trusting a readiness marker every artifact shares;
- the **preview iframe's `title` and `name`** (`Artifact preview` / `artifact-preview`);
- the **plugin checkboxes** and their `Config for <package>` textboxes;
- `data-testid="draw-comments-host-surface"`, the host content the widget suites annotate.

Renaming any of those breaks suites in other packages. The e2e-facing bytes of the injected document
are pinned by `src/srcdoc-baseline.json` — a recorded fixture, not source. Regenerate it only when
the srcdoc is *meant* to change, and re-run both suites when you do.

## Layout

```
index.html ──► src/host.tsx ──► src/components/HostPage.tsx
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
 HostForm                    buildIframeParts()          ArtifactViewPanel
  ├─ ConfigFormArtifact        (+ srcdoc-assets)           ├─ App (iframe, srcDoc)
  ├─ ConfigFormListArtifact         │                      ├─ Source / AI Bridge /
  └─ ClaudeSimulator                │                      │  Artifact source /
       └─ StorageExplorer           │                      │  Playground source  → SourceView
                                    ▼                      └─ Config / AI Input
 useHostConfig ──► playground-state.ts  (persist/restore/validate)
       └────────► playground-url.ts     (?artifact=, ?source=)
                  playground-config.ts  (Config, PlaygroundMode, PlaygroundCatalog)
```

`playground-state.ts`, `playground-url.ts` and `buildIframeSrcdoc.ts` are pure: no `localStorage`,
no `window`, no `import.meta.env`, no artifact registry. The hook reads the browser and passes
strings in; `constants.ts` builds the catalogue they validate against; `srcdoc-assets.ts` holds the
Vite-resolved bridge assets. That is what makes them testable under `bun test`, and it is why the
types live in `playground-config.ts`, which imports nothing — leaving them in the hook would be an
import cycle, and `qa:arch-check` counts type-only imports.

The host page contains no domain logic. It builds a configuration, builds a document from it, and
simulates the host around it.

## Not here

- **Styling of the artifacts themselves** — this app styles only its own chrome (Tailwind v4). What
  the artifact looks like is the artifact's business.
- **Publishing** — `nx release` on merge to `main` handles artifact packages (ADR-0013). This app is
  `private` and ships as a static site.
- **A features package of its own** — the `*-features` packages describe *artifact* behaviour
  executed *through* this playground. Covering the playground's own chrome with Gherkin would make
  the harness its own subject; its chrome is covered by `bun test`, Storybook, and the suites that
  depend on it.
