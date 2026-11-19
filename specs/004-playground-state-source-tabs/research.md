# Phase 0 Research: Playground State Persistence & Source Tabs

**Feature**: [spec.md](./spec.md) | **Date**: 2026-11-18

No `NEEDS CLARIFICATION` markers entered this phase — the spec resolved its ambiguities as
recorded assumptions. What this phase resolves instead is the set of design decisions that the
existing code forces, several of which are not obvious from the spec.

## R1 — Where the form state lives

**Decision**: one `localStorage` key, `dev-playground:config:v1`, holding
`{"v":1,"config":{…}}` — the whole `Config` object that `useHostConfig` already owns.

**Rationale**: `Config` is already the single source of truth for the left form and the only
input to the srcdoc builder, so persisting it persists exactly the fields FR-002 enumerates with
no field-by-field plumbing. One key keeps the write atomic — a partially written setup cannot be
restored. `localStorage` (not `sessionStorage`) is what the request asked for and is also right:
it survives a window close, and both open tabs see the same key.

**The key's prefix is a correctness constraint, not cosmetics.** `useLocalStorageEntries`
(`src/hooks/useLocalStorageEntries.ts`) lists storage via `LocalKeyValueStore.list(prefix)`, which
is `Object.keys(localStorage).filter(k => k.startsWith(prefix))`, with `prefix = "alistigo"`, and
presents the result to the developer as the artifact's storage. A key starting with `alistigo`
would therefore appear in the Storage explorer as if the artifact had written it, and would be
offered for deletion there. Hence the `dev-playground:` prefix (FR-006).

**Alternatives considered**:
- *`sessionStorage`* — survives a reload but not a new tab, and would not be shared between two
  playground windows. Rejected: the request says local storage, and per-tab isolation is a
  downgrade, not a feature.
- *IndexedDB* — asynchronous, needs a schema, buys nothing for one small object. Rejected.
- *One key per field* — a half-written setup becomes restorable, and `localStorage.clear()`
  (which the e2e harness calls) leaves no simpler trace. Rejected.
- *URL as the only state* — rejected because it fails the stated requirement (a reload must
  keep the values even when the address carries nothing) and would need the app to rewrite its
  own address on every keystroke.

## R2 — Surviving a bad or stale saved setup

**Decision**: a versioned envelope plus field-level sanitisation. Read → parse JSON → if `v`
is not the known version, discard the whole thing and use defaults → otherwise validate each
field against the live catalogue (`KNOWN_APPS`, the artifact's `availablePlugins`, the fixture
names, the `PlaygroundMode` union, `AI_CONTEXTS`) and drop only the fields that fail.

**Rationale**: FR-004 asks for per-field fallback (keep what is still valid) and FR-005 for
whole-object resilience. A version bump is the escape hatch for a shape change that per-field
validation cannot interpret. All of this is pure string → object logic, so it is directly
`bun test`-able, which is why it lives outside the hook.

**Specific hazard it covers**: the artifact registry is the catalogue, and it changes as
artifacts are added and removed. A setup saved against an artifact that was later unregistered
must not leave the form showing a package the playground cannot load — `ARTIFACT_REGISTRY[app]`
would be `undefined` and `resolveScriptUrl` would hand the iframe an empty `src`. Per-artifact
plugin lists shift the same way: a plugin valid for `artifact-list` is not valid for
`artifact-ai-draw-comments`, so plugin keys are validated against the *restored* artifact, after
the artifact itself has been resolved. Order matters: artifact first, then everything scoped to it.

## R3 — The address parameters

**Decision**: `?artifact=<name>` and `?source=dev|prod-local`, read once during the first render
and layered over the restored setup. The app never writes to its own address.

**Rationale**: FR-009 (address beats storage), FR-011 (a later form change sticks). Reading once
at init satisfies both for free: there is no effect watching `location.search`, so nothing can
re-apply the parameter and fight the developer's next click. Not rewriting the address keeps the
change small and matches the recorded assumption — the link is produced by hand or by a tool.

`artifact` accepts both the full package name (`@alistigo/artifact-list`) and its bare suffix
(`list`, `artifact-list`), resolved against `KNOWN_APPS`. Typing a scoped package name with its
`@` and `/` into a URL is awkward enough that the short form is worth supporting, and resolution
is unambiguous because the suffix is unique within the registry. `source` accepts `dev` and
`prod-local`, plus `prod local` / `prod_local` as spelling tolerance for the label the form shows.

An unresolvable value is ignored in favour of the stored or default value (FR-010) — silently, by
design: a dev-tool address should never dead-end, and the form visibly shows what it actually
chose.

**Alternatives considered**:
- *Path segments* (`/list`) — rejected: the app is served as a static SPA from GitHub Pages with
  no rewrite rules, so a deep path 404s.
- *Hash parameters* — rejected: query parameters are what the request asked for and what tools
  compose most easily.
- *Two-way sync (the form rewrites the address)* — rejected for this iteration; it is additive
  later and FR-011 explicitly does not want the address to keep asserting itself.

## R4 — Precedence

**Decision**: `defaults ◁ sanitised stored ◁ address overrides`, computed once, as the initial
value of the existing `useState<Config>`.

**Rationale**: this is the only ordering that satisfies FR-003, FR-009 and FR-011 together, and
expressing it as an initial-state computation rather than a chain of effects means the first
render already has the final configuration. That matters beyond tidiness: the preview's srcdoc is
a `useMemo` over `config`, so an effect-based restore would boot the iframe once with defaults and
again with the restored setup — two artifact loads, two mounts, and a visible flash on every page
open. It would also give the e2e harness a window in which the combobox reads one artifact while
the iframe holds another.

## R5 — Making "Source = the merge of the other tabs" structural

**Decision**: `buildIframeSrcdoc` becomes two steps. `buildIframeParts(options)` returns an
ordered `SrcdocPart[]`, each part being `{ segment, text }`; `assembleSrcdoc(parts)` joins their
text in order. The Source tab shows `assembleSrcdoc(parts)`; each new tab shows the parts whose
`segment` matches it. `buildIframeSrcdoc(options)` stays as a one-line wrapper over both.

**Rationale**: FR-017 demands that nothing is missing from every view and nothing appears in two.
If each tab filtered the finished HTML with its own string surgery, that property would be an
assertion maintained by hand and would rot the first time a `<script>` moved. With one ordered
list and one `segment` tag per part, completeness is "every part has a segment" and
non-duplication is "each part has exactly one" — both checkable in a few lines of `bun test`, and
neither can drift as the template changes.

**Segment assignment** (the full mapping lives in [contracts/srcdoc-segments.md](./contracts/srcdoc-segments.md)):

| Part of today's template | Segment |
|---|---|
| doctype, `<html>`, `<head>`, `<body>` scaffolding, console shim, CSP meta, charset/viewport, `<title>` | `playground` |
| `html-to-image` script tag, the `claude-artifact-api` bridge HTML, `window.claudeArtifactStatus` | `ai-bridge` |
| the artifact's `<script type="module" src=…>` entry tag | `artifact` |
| `<script type="application/json" id="alistigo-config">` | `config` |
| `<script id="ai-input-action" type="text/markdown">` | `ai-input` |
| plugin URL overrides, the React-refresh preamble, the draw-comments host surface | `playground` |

The three judgement calls, and why:
- **`window.claudeArtifactStatus` is AI-bridge, not playground.** The real Claude host sets it;
  the playground only simulates that host. It belongs with the rest of what the AI chat injects.
- **Plugin URL overrides and the React-refresh preamble are playground.** Neither exists in a real
  Claude artifact — both are local dev plumbing — so they are precisely "the rest" that FR-015
  describes.
- **The draw-comments host surface is playground.** It is host page content the playground
  supplies for a widget to annotate, not part of the artifact bundle.

The `artifact` segment ends up being a single script tag. That is the honest answer to "the code
to inject the artifact only, without the bridge, the config tag and the AI input tag" — the tab's
value is that it names the one line that actually loads the artifact and shows how its URL changes
between `dev`, `prod-local` and the CDN.

## R6 — Keeping the assembled output byte-identical

**Decision**: the refactor must not change a single character of the assembled srcdoc, and a
`bun test` asserts it against a recorded expectation for a representative set of configurations.

**Rationale**: this is the main protection for FR-019. The suites assert on srcdoc content —
`probePlayground` reads `#alistigo-config` out of the iframe, `PlaygroundPage.previewApp()` parses
it, `routes.ts` intercepts the bundle URL the entry tag requests, and the draw-comments suite
depends on the host surface being present. Whitespace inside the document is also not free: the
Source tab is read by humans, and the AI-input `<script type="text/markdown">` carries content
where added indentation would be visible. Holding the output constant makes the whole refactor
provably invisible to anything downstream.

**Consequence for the design**: the parts carry the template's existing whitespace and newlines in
their `text`, and `assembleSrcdoc` joins with the empty string. Per-segment display joins with a
newline instead, since a segment's parts are not adjacent in the document and reading them
butted together would be worse.

## R7 — Keeping the testable core free of Vite

**Decision**: a new `src/srcdoc-assets.ts` holds the `?raw` bridge import, the `?url`
`html-to-image` import, the `__ALISTIGO_DEV_HOSTNAME__`-derived CSP and the `import.meta.env`
reads. `buildIframeParts` receives them as plain values.

**Rationale** *(corrected 2026-11-19, during implementation)*: the original rationale given here
was that `bun test` cannot resolve `?raw` / `?url`. **That is false** — measured during
implementation, bun resolves both, and `SRCDOC_ASSETS.bridgeHtml` loads all 8796 characters of the
inject script under `bun test`. The extraction is still right, but for the reason the tests
actually rely on: it makes the builder a pure function of its arguments, so a test can feed a stub
bridge string and assert the AI-bridge segment contains exactly it — rather than asserting against
the real 8.8 KB bridge, where "the segment contains the bridge" would be untestable in any useful
way. It also keeps the byte-identity fixtures small and readable.

The same reasoning, unchanged, applies to the catalogue argument: the pure modules take a
`PlaygroundCatalog` instead of importing `constants.ts`, because a test that must build the real
registry to check a parse rule is testing the wrong thing.



## R8 — Tab order and the complexity gate

**Decision**: the three new tabs are **grouped with `Source`**, directly after it — `App`,
`Source`, `AI Bridge`, `Artifact source`, `Playground source`, `Config`, `AI Input` — and the tab
list becomes data: an array of `{ id, label, render }` that the panel maps over.

**Rationale**: the four tabs that show the injected page's code belong together, and `Source` is the
whole of what the three new ones partition — putting them anywhere else asks the reader to hold that
relationship in their head. The cost is that `Config` and `AI Input` shift two places right, which
is why FR-012 was first read conservatively as "append". That reading was confirmed with the
requester and reversed: FR-012 and User Story 3's scenario 7 now require the grouping and ask only
that the existing four keep their names, their *relative* order and their behaviour.

**Rejected**: appending after `AI Input`. It preserves absolute positions, which nothing actually
depends on — no test, no documentation and no muscle memory worth protecting for tabs that are
themselves new — in exchange for splitting the code views across the row.

The data-driven list is a gate requirement, not a preference. `ArtifactViewPanel` already carries
`// fallow-ignore-next-line complexity`; adding three more conditional branches to a component that
is already over the threshold would mean widening a suppression, and the repo's Fallow policy
reserves an inline `fallow-ignore-next-line` for a per-function reason that sits next to it. A table of renderers keeps the component's branching flat, so the
existing single ignore stays accurate instead of covering more.

**Rejected**: a separate `CodeTabs` component. It would need its own `.stories.tsx`
(`qa:stories-check` scans `apps/*/src/components/*.tsx`), and it would exist only to hold a
`.map()`. Not worth a file.

## R9 — Reusing the Source tab's viewer

**Decision**: extend `SourceView` with `code`, `label` and an optional `emptyMessage`, and render
all four code tabs through it. No new component.

**Rationale**: the request explicitly asks for the same coloured viewer. `SourceView` already owns
the `prism-react-renderer` + night-owl rendering, the header and the copy button; the only things
hard-coded are the `srcdoc HTML` caption and the assumption that there is always content. `label`
covers the first, `emptyMessage` the second (FR-013's "this context injects no bridge code"). Its
existing `html` prop is renamed to `code` because three of the four callers no longer pass a whole
document — a rename the only caller and the story absorb in the same commit.

## R10 — Why the end-to-end suites survive this (FR-019, FR-020, FR-021)

Walked through the harness rather than assumed. Four interactions, each checked:

1. **Fresh state per scenario.** `ArtifactWorld.beforeScenario` calls `browser.newContext()` and
   `afterScenario` closes it, so every scenario starts with an empty `localStorage` and therefore
   with the playground's documented defaults. FR-020 holds with no harness change. *Risk: none.*

2. **`seedStorage` clears everything.** It runs `localStorage.clear()` in the main frame — the
   playground's own origin — then reloads through `reloadArtifact()`. So a seed also drops the
   saved setup, the playground comes back on defaults, and `PlaygroundPage.reload()` re-selects
   the requested artifact exactly as it does today. *Risk: none, and deliberately left alone:
   teaching `seedStorage` to preserve the playground's key would change harness behaviour that
   every suite depends on, to fix a problem no scenario has.*

3. **Plugins now survive a bare reload.** Today `reloadArtifact()` drops the plugin checkboxes
   back to empty because they live in React state; with persistence they come back ticked. No
   scenario asserts that a plugin is *gone* after a reload, and the two suites that enable a
   plugin and then reload are unaffected either way, because both plugins they rely on load
   anyway: `@alistigo/artifact-user-plugin` and the checkbox plugin are both
   `DEFAULT_FEATURE_PLUGINS` in `packages/artifact-list/src/plugins.ts`, so the playground
   checkbox is belt-and-braces. The change is strictly in the direction of "the reloaded page
   matches what the form shows". *Risk: low; the `@artifact-plugins` tagged scenarios are the
   verification target.*

4. **`selectArtifact`'s fast path.** It returns early when the combobox already holds the
   requested artifact, skipping `waitForPreviewApp`. After a reload the combobox will now already
   hold it, so the early return triggers where it previously did not, and readiness is then
   established by `waitForArtifactReady()` against a freshly created iframe. The scenario the
   comment in `world.ts` names as the regression guard — draw-comments' "Reloading the artifact
   discards an in-progress annotation" — is the specific thing to re-run. *Risk: low, but this is
   the one place where the ordering genuinely changes, so it gets its own verification task rather
   than riding along.*

## R11 — Clear Data must not take the form setup with it

**Decision**: `handleClearData` re-writes the persisted envelope after the clear. The clear itself
keeps its current, origin-wide reach.

**Rationale**: the preview iframe is a `srcdoc` with `sandbox="allow-scripts allow-same-origin"`, so
it shares the playground's origin, and `useIframeControls.clearData()`'s
`iframe.contentWindow.localStorage.clear()` is therefore a clear of *the playground's own* storage
area — `dev-playground:config:v1` included. Nothing on screen changes when it happens: the form
still shows every value, because `Config` is React state, and the persist effect is keyed on
`config`, which did not change. The setup then disappears at the next page load, with no visible
cause to connect it to a button pressed ten minutes earlier. Clearing an artifact's data and
resetting the playground's own configuration are separate intentions, and only one of them was asked
for.

**Alternatives considered**:
- *Filter the clear to `alistigo`-prefixed keys* — the obvious fix, and wrong: the list artifact
  persists its document under the bare key `document`
  (`packages/artifact-list/src/utils/list-key-value-adapter.ts:12`), so the filter would stop Clear
  Data clearing the very thing it exists to clear. Worth noting that the Storage explorer's
  `alistigo` prefix does not cover that key either — the explorer and Clear Data see different sets.
- *Hold the setup somewhere the clear cannot reach* (sessionStorage, a cookie) — splits one piece of
  state across two stores to work around one button. Rejected.
- *Leave it* — rejected: it is a silent data loss with no feedback, and the kind of bug that gets
  diagnosed as "the playground randomly forgets things".

**One documentation correction falls out of this.** `cli/artifact-features-runner-playwright/src/harness/world.ts`
states in a comment that the playground "keeps the chosen artifact in React state only — no URL
parameter, no storage", and justifies `reloadArtifact()`'s re-selection step with it. That premise
becomes false here. The behaviour stays (re-selecting is still correct, now usually a no-op), but
the comment must be corrected in the same change, or the next person reads a reason that no longer
holds and deletes the step.
