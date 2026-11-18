# Phase 1 Data Model: Draw-Comments End-to-End Features via the Generic Runner

**Feature**: `specs/003-draw-comments-e2e-harness` | **Date**: 2026-11-17

This feature adds no persisted domain data and no document format. Its "entities" are the
build-time and run-time structures the harness and the packages exchange. Each is listed
with its fields, where it lives, and the rules that must hold.

---

## 1. `ArtifactWorld` — the shared Cucumber World

**Lives in**: `cli/artifact-features-runner-playwright/src/harness/world.ts`
**Exported from**: `@alistigo/artifact-features-runner-playwright/harness`
**Lifetime**: one instance per scenario, constructed by Cucumber.

| Field | Type | Set by | Notes |
|---|---|---|---|
| `baseUrl` | `string` | constructor | `PLAYWRIGHT_BASE_URL` → `ALISTIGO_APP_URL` → `http://localhost:4173` |
| `artifact` | `string \| undefined` | constructor | from `ARTIFACT_FEATURES_ARTIFACT`; undefined means "whatever the playground defaults to" |
| `browser` | `Browser` | `beforeScenario` | the single run-wide browser, passed in by the harness hook |
| `context` | `BrowserContext` | `beforeScenario` | fresh per scenario — no state leaks between scenarios |
| `page` | `Page` | `beforeScenario` | fresh per scenario |
| `playgroundPage` | `PlaygroundPage` | `beforeScenario` | base page object; a domain subclass may replace it |
| `pageErrors` | `string[]` | `pageerror` listener | append-only within a scenario |

**Methods** (the generic surface domain steps may rely on):

| Method | Contract |
|---|---|
| `beforeScenario(browser)` | Idempotent per scenario; throws if called with a different browser than an earlier call. Installs routes **before** first navigation, then opens the playground. |
| `afterScenario()` | Closes page then context, swallowing errors. Never throws. |
| `seedStorage(entries)` | Writes `Record<string, string>` into the preview origin's `localStorage` after clearing it, reloads, waits for readiness. The generic replacement for list-specific `setDocument`. |
| `reloadArtifact()` | Reloads and waits for readiness. Storage survives. |
| `enablePlugin(packageName)` | Ticks the playground checkbox, awaits the iframe renavigation, waits for readiness. |
| `setPluginConfig(config)` | Records config to apply on the next plugin enable. |

**Validation rules**

- `beforeScenario` MUST install every route before the first `goto`; a route added after
  navigation misses the fetch it was meant to intercept.
- A scenario tagged `@todo` MUST NOT reach `beforeScenario` — no context is created for it.
- Subclasses MUST call `super.beforeScenario(browser)` before adding domain setup.

---

## 2. `PlaygroundPage` — the shared page object

**Lives in**: `cli/artifact-features-runner-playwright/src/harness/playground.page.ts`
**Exported from**: the harness entry point.

| Member | Type | Purpose |
|---|---|---|
| `baseUrl` | `string` | where `open()` navigates |
| `page` | `Page` | the host page (playground chrome), not the iframe |
| `artifactFrame` | `FrameLocator` | `iframe[title="Artifact preview"]` — the artifact's own DOM |
| `previewFrame` | `Frame \| null` | the same frame by name `artifact-preview`, for `evaluate`/`waitForFunction` |

| Method | Contract |
|---|---|
| `open()` | `goto(baseUrl)`; if `artifact` is set, select it in the `Artifact` combobox and await the iframe renavigation; then `waitForArtifactReady()` |
| `selectArtifact(name)` | Selects by value in the combobox named `Artifact`; fails with the offered list if absent |
| `waitForArtifactReady()` | Waits for `[data-testid="alistigo-app"]` inside `artifactFrame` to be visible |
| `reload()` | `page.reload()` + `waitForArtifactReady()` |
| `enablePlugin(name)` / `fillPluginConfig(name, json)` | Playground chrome interactions, awaiting iframe renavigation each time |

**Validation rules**

- `waitForArtifactReady` is the single readiness contract. Every artifact **and widget**
  rendered in the playground MUST expose `data-testid="alistigo-app"` on its mounted root.
- `PlaygroundPage` MUST NOT contain any locator naming a domain concept (no list rows, no
  draw-comment buttons). Domain locators belong to a subclass in a features package.

---

## 3. `ReadinessMarker` — the platform test contract

**Value**: `data-testid="alistigo-app"`

| Producer | Where |
|---|---|
| `@alistigo/list-components-react` | `AlistigoApp.tsx` root `<div>` (already present) |
| `@alistigo/artifact-ai-draw-comments` | `App.tsx` root `div.ai-draw-comments` (**added by this feature**) |
| Any future artifact or widget | its mounted root |

**Rules**

- Exactly one element carrying the marker per preview iframe.
- Present only once the artifact is mounted and interactive — not on a loading shell.
- Adding it to a `widget` package does not subject that package to the rest of the Artifact
  Contract.

---

## 4. `BundleRoute` — local-build interception

**Lives in**: `cli/artifact-features-runner-playwright/src/harness/routes.ts`

| Field | Type | Meaning |
|---|---|---|
| `urlPattern` | `string` | `https://cdn.jsdelivr.net/npm/@alistigo/**` |
| `packageName` | derived | parsed back out of the requested URL, major-pin (`@0`) stripped |
| `localDist` | `string \| undefined` | the package's resolved `dist/` file in the workspace |
| `fallthrough` | behaviour | when `localDist` is missing, the request continues to the network |

**Fulfilment headers**: `content-type: application/javascript; charset=utf-8` and
`access-control-allow-origin: *` — a cross-origin dynamic `import()` fetches in CORS mode
and there is no upstream response to inherit the header from.

| Companion route | Serves |
|---|---|
| Claude storage stub | an in-line module whose `storage.isAvailable()` returns `false` |
| `html-to-image` | the cdnjs URL, from the locally installed copy (F4) |
| Dev-server plugin paths | `**/<unscoped-name>/src/**`, for the dev playground's `/@fs/` overrides |

**Rules**

- Routes are installed per page, before the first navigation.
- A missing local build MUST fall through rather than fail the scenario — the diagnosis
  belongs to `doctor`, not to a route handler.
- Route installation MUST be domain-agnostic: resolution is by package name from the
  workspace, never by a hard-coded relative path. (The current
  `../../../../packages/local-storage-plugin/dist/index.js` read in `list-features` is
  exactly the cross-package relative escape the constitution forbids, and does not survive
  the move.)

---

## 5. Features package manifest contract (unchanged, newly satisfied)

| Field | `@alistigo/list-features` | `@alistigo/artifact-ai-draw-comments-features` |
|---|---|---|
| `alistigo.type` | `features` | `application` → **`features`** |
| `alistigo.domain` | `list` | *(absent)* → **`artifact-ai-draw-comments`** |
| `exports["."]` | `./dist/index.js` | *(absent)* → **`./dist/index.js`** |
| `FEATURES_DIR` | `<dist>/../features` | **added** |
| `STEP_DEFINITIONS_DIR` | `<dist>/step-definitions` | **added** |
| `SUPPORT_DIR` | `<dist>/support` | **added** |
| `files` | `["dist","features"]` | `["features"]` → **`["dist","features"]`** |

**Rules enforced by `artifact-arch-check features`**

- `features/naming-convention` — unscoped name ends with `-features` ✓ (no rename needed)
- `features/domain-required` — `alistigo.domain` present and non-empty
- `features/domain-consistent` — equals the unscoped name minus `-features`, hence
  `artifact-ai-draw-comments`
- `features/domain-unique` — distinct from `list` ✓

---

## 6. Playground artifact registration

**`ARTIFACT_REGISTRY` entry** (`packages/artifact-manager/src/registry.ts`), **appended** so
`KNOWN_APPS[0]` keeps pointing at the list artifact:

| Field | Value |
|---|---|
| key | `@alistigo/artifact-ai-draw-comments` |
| `cdnUrl` | `https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js` — `@0` major pin per ADR-0011 |
| `skillPackage` | `@alistigo/artifact-ai-draw-comments-skill` |
| `availablePlugins` | `[]` |

**Three companion edits**, each required for a different mode:

| Edit | File | Needed for |
|---|---|---|
| workspace dependency | playground `package.json` | resolution at all |
| dynamic-import branch | `artifact-entry.tsx` | the iframe loading the right bundle |
| source alias | playground `vite.config.ts` | dev mode serving source instead of `dist` |

---

## 7. `HostSurface` — the playground's stand-in host artifact

**Lives in**: the playground's `artifact-entry.tsx` branch for this artifact.

| Field | Value |
|---|---|
| marker | `data-testid="draw-comments-host-surface"` |
| content | a heading and two paragraphs of static prose, modelled on the widget's `demo/index.html` |
| position | rendered into the iframe body **before** the widget mounts, so `auto-mount`'s `prepend` puts the widget above it |

**Rules**

- Static markup only — no interactivity, nothing the widget could be confused with.
- Large enough that a ≥20×20 px region can be selected over it (the overlay's minimum).
- Required by `embed-host` and by `draw-comment-send` scenario 5; without it those
  scenarios have no host content to be visible (F2a).

---

## 8. State transitions exercised by the scenarios

The widget's own `SessionStatus`, projected from its event log, is what the scenarios walk.
No change to these transitions is in scope; they are listed because the step definitions
assert the UI that corresponds to each.

```text
idle ──AnnotationStarted──▶ selecting ──RegionSelected──▶ drawing
  ▲                            │                            │
  │                     AnnotationCancelled           ShapeDrawn (self)
  │                            │                            │
  └────────────────────────────┴──────────◀───AnnotationCancelled
                                                             │
                                               AnnotationSubmitting
                                                             ▼
                                                        submitting
                                                     ┌───────┴────────┐
                                              AnnotationSent      SendFailed
                                                     ▼                ▼
                                                   sent          drawing + error
                                                     │
                                             ClaudeResponded
                                                     ▼
                                                 responded ──AnnotationStarted──▶ selecting
```

| Status | What the UI shows (the step definitions' anchor) |
|---|---|
| `idle` | "Draw Comment" enabled; no overlay |
| `selecting` | full-screen overlay, crosshair cursor, "Cancel selection" button |
| `drawing` | canvas + toolbar + comment input; Send enabled once a shape exists |
| `submitting` | Send shows "Sending…", controls disabled |
| `sent` | thread image present; "Claude is thinking…" — **unreachable in practice**, see research D5 |
| `responded` | thread image + comment + response text; "Draw Comment" enabled again |
