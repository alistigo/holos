# Alistigo AI — Milestones

> **Source of truth:** Each milestone's PRD is the authoritative reference for scope, requirements, and acceptance criteria. This file is a roadmap overview; use the PRDs for implementation planning.
>
> | Milestone | PRD |
> |-----------|-----|
> | M1 — Base list app | [`.agents/prds/alistigo-ai-m1.md`](../../.agents/prds/alistigo-ai-m1.md) |
> | M2 — Artifact Playground & Common Architecture | [`.agents/prds/alistigo-ai-m2.md`](../../.agents/prds/alistigo-ai-m2.md) |
> | M3 — Plugin Architecture & First Plugin | [`.agents/prds/alistigo-ai-m3.md`](../../.agents/prds/alistigo-ai-m3.md) |
> | M4 — Second List Type via Plugins | [`.agents/prds/alistigo-ai-m4.md`](../../.agents/prds/alistigo-ai-m4.md) |
> | M5 — Host ↔ Iframe Protocol | [`.agents/prds/alistigo-ai-m5.md`](../../.agents/prds/alistigo-ai-m5.md) |
> | M6 — Public Beta | [`.agents/prds/alistigo-ai-m6.md`](../../.agents/prds/alistigo-ai-m6.md) |

Each milestone has: a **goal**, a **scope** (what's in / what's out), the **deliverables**, and pointers to the **Gherkin features** that define acceptance.

Milestones are versioned and incremental. Each one ships something that works end-to-end — not a shelf of half-built layers.

---

## Architecture Principle — Config-Doc / State-Doc Contract

Every `@alistigo` artifact follows a two-document contract:

**Config document** — JSON provided on the host page (via a DOM element or postMessage API) that configures the artifact before it boots. Minimum example:
```json
{ "app": "@alistigo/artifact-list", "lang": "en" }
```

**State document** — JSON the artifact reads/writes; can be pre-loaded from the page or injected via API. Represents the artifact's persisted domain state.

Both documents are self-contained, version-stamped, and round-trippable. This makes every artifact embeddable in any host without bespoke integration code. Validation for both documents is defined in their respective `*-format` packages.

---

## M1 — Base list app (v0.2.0)

**Goal:** prove the loop *command → event → projection → render → persisted log* end-to-end with the absolute minimum: a **base list app** holding text Elements, with add / delete / persist — and **no plugin behavior at all**.

This is the foundational artifact: an LLM hands the iframe a JSON list document; the User adds and deletes text Elements; the events survive a reload and replaying them reproduces the exact state. Specialised list types (todo, checklist, grocery, wishlist) are NOT in M1 — they come later as plugins on top of this base.

### Scope

In:
- The **base list** only — text Elements, no checkbox, no priority, no due date, no images, no categories
- Internal element order is preserved on read but **NOT displayed** to the User
- **Duplicates allowed** — two Elements with the same `text` are two distinct identities
- A **single rendering target**: standalone iframe-embeddable web app
- **Event-sourced core** — commands (`AddElement`, `DeleteElement`, `CreateList`) emit events (`ElementAdded`, `ElementDeleted`, `ListCreated`) into an append-only log; a pure projector folds events into the current document
- A **single persistence backend**: `LocalStorageEventStore` (event log lives in `localStorage`; an optional projection cache may live alongside it)
- Document loading via URL fragment (the document is *imported* — synthesized into a fresh event log) or default-to-empty
- Document export via "copy JSON" button (default: projection only; opt-in: projection + event log)
- A working **Gherkin runner** that drives the app at the Application layer (commands in, events out, projection asserted) and asserts feature scenarios

Out (deferred to later milestones):
- Platform extraction / Artifact Playground (M2)
- Plugin system (M3)
- Specialised list types (todo, grocery, wishlist) — M4+ via plugins
- Host ↔ iframe `postMessage` protocol (M5)
- Theming (M5)
- Sync to API (post-1.0)

### Deliverables

| Artifact | Where |
|----------|-------|
| Frontend app (Vite + TS + a lightweight UI lib) | `apps/alistigo-artifact-playground/` (renamed to `alistigo-artifact-playground` in M2) |
| Document format package (specification + JSON Schema + TS types + validation helpers) | [`packages/alistigo-document-format/`](../../packages/alistigo-document-format/) |
| Domain package (entities, value objects, event/command types) | `packages/alistigo-domain/` |
| Document editor (command handlers, projector glue, ports) | `packages/alistigo-document-editor/` |
| `LocalStorageEventStore` adapter | `apps/alistigo-artifact-playground/src/adapters/` |
| Gherkin runner (Application-level + Playwright bridge) | `packages/alistigo-features-runner/` |
| Sample documents AND sample event logs | `apps/alistigo-artifact-playground/fixtures/` |
| `.feature` specs (acceptance) | [`packages/alistigo-features/features/core/`](../../packages/alistigo-features/features/core/) |

### Acceptance — Gherkin Features

See [`packages/alistigo-features/features/core/`](../../packages/alistigo-features/features/core/):

- `display-list.feature` — render an empty or populated list (including duplicates)
- `add-element.feature` — append a text Element
- `delete-element.feature` — remove an Element by identity (or by row when duplicates collide)
- `persist.feature` — survive an iframe reload

A milestone is **done** when the runner reports green on every scenario in this folder *and* replaying the event log produces the same projection.

---

## M2 — Artifact Playground & Common Architecture (v0.3.0)

**Goal:** extract the M1 app into a **generic Artifact Playground** and introduce the config format system and artifact manager — so any future `@alistigo` artifact slots in without repeating the iframe/host plumbing.

### Scope

In:
- **Renames**
  - `packages/alistigo-artifact` → `packages/alistigo-artifact-list` (npm: `@alistigo/artifact-list`)
  - `apps/alistigo-artifact-playground` → `apps/alistigo-artifact-playground`
  - All cross-package references updated accordingly
- **`@alistigo/artifact-config-list-format`** (leaf package) — JSON Schema + TS types for list-specific config, including `readonly` field (boolean, default false; when true the list renders display-only with no add/delete)
- **`@alistigo/artifact-config-format`** — base config schema (`{ "app": "<name>", ... }`) + discriminated union combining all known per-artifact schemas; validates a config document; depends on `@alistigo/artifact-config-list-format` (dependency direction: leaf → aggregate, never the reverse)
- **`@alistigo/artifact-manager`** — reads config JSON from host page, validates via `@alistigo/artifact-config-format`, resolves `config.app` → CDN UMD URL from internal artifact map, injects `<script>` tag; exported as UMD (self-contained, no external runtime deps) + ESM
- **Artifact Playground** two-page app:
  - *Host page*: split vertically — left Dev Config Form (React), right `<iframe>`
  - *Iframe page*: runs `@alistigo/artifact-manager` with config; manager boots the selected artifact
- **Dev Config Form** generic controls: artifact type selector, language selector, AI chat context ("claude" only for now), reload button, clear-data button; plus dynamic per-artifact section (M2 exposes the list's `readonly` toggle)
- **Claude iframe simulation** — iframe attributes must match Claude's production embed exactly:
  ```html
  <iframe
    style="zoom: 1; height: 100%; width: 100%;"
    sandbox="allow-scripts allow-same-origin"
    referrerpolicy="no-referrer"
    data-no-service-worker="true"
    allow="fullscreen; clipboard-write"
    src="..."
  />
  ```
  Use `style` (not `class`) for sizing.
- **CSP headers** on the iframe page — match Claude's CSP, with `localhost` and `127.0.0.1` added to the allowed-host list; implemented via Vite dev server middleware
- All `@m1` Gherkin scenarios continue to pass against the refactored playground

Out:
- Plugin system (M3)
- Second artifact type (M4)
- Full postMessage host ↔ iframe protocol (M5)
- Production CDN hosting (M6)

### Package Dependency Graph

```
@alistigo/artifact-config-list-format   (leaf)
          ↑ imported by
@alistigo/artifact-config-format
          ↑ used by
@alistigo/artifact-manager
          ↑ used by
apps/alistigo-artifact-playground
```

### Deliverables

| Artifact | Where |
|----------|-------|
| Renamed list artifact package | `packages/alistigo-artifact-list/` |
| List-specific config format | `packages/alistigo-artifact-config-list-format/` |
| Combined config format | `packages/alistigo-artifact-config-format/` |
| Artifact manager (UMD + ESM) | `packages/alistigo-artifact-manager/` |
| Generic playground app | `apps/alistigo-artifact-playground/` |

---

## M3 — Plugin Architecture & First Plugin (v0.4.0)

**Goal:** introduce the plugin system **on top** of the M2 base list, and ship the first plugin (`checkbox-element`) to establish the pattern. With this milestone, the *base list* and *plugins* are independently composable.

### Scope

In:
- A `Plugin` interface (data extension + render contributions + commands + events)
- `checkbox-element` plugin — adds a checkbox column to Elements and a `complete` / `uncomplete` action; this is the seed of the **todo list** type
- Plugin registry and loading mechanism
- Document-level `alistigo:plugins` field declares which plugins a document opts into
- Validation: a document referencing a plugin that isn't registered fails fast with a useful error

Out:
- A second plugin (M4)
- Host integration (M5)

### Deliverables

- `Plugin` interface in `packages/alistigo-plugin-api/`
- `checkbox-element` plugin in `packages/alistigo-plugin-checkbox/`
- All M1 `.feature` files still pass against the new plugin-driven implementation (the base list is unchanged from the User's perspective)
- New feature group `packages/alistigo-features/features/checkbox/` covering the plugin's lifecycle and the new actions (complete / uncomplete)
- New `@checkbox` group tag (added to `src/tags.ts` and `docs/tags.md`)

---

## M4 — Second List Type via Plugins (v0.5.0)

**Goal:** prove the plugin system by composing a *different* list type from primitives — without touching the core list or the checkbox plugin.

### Scope

In:
- One additional list type — pick the most LLM-relevant: **grocery list** (checkbox + quantity + category) or **wishlist** (image + price + priority). Decide in planning notes before starting.
- 2–3 new plugins to support that list type (e.g. `quantity`, `category`, or `image`, `price`, `priority`)
- Sample documents for the new list type

Out:
- Host protocol
- Drag-and-drop reordering (if not naturally provided by the chosen plugins)

### Deliverables

- New plugin packages
- Sample documents under `apps/alistigo-artifact-playground/fixtures/`
- New feature group folder(s) under `packages/alistigo-features/features/<plugin-or-list-type>/` with matching group tags

---

## M5 — Host ↔ Iframe Protocol (v0.6.0)

**Goal:** make Alistigo a real *embedded* widget. The host (an AI chat surface) can hand it a document, watch it change, push updates to it, and theme it.

### Scope

In:
- `postMessage` protocol: `alistigo:ready`, `alistigo:document`, `alistigo:patch`, `alistigo:state` events
- Versioned protocol envelope (so future changes don't break older hosts)
- A reference host page (`apps/alistigo-host-demo/`) that demonstrates the full protocol
- Theming hooks (CSS custom properties / inherited tokens) so the widget visually matches the host
- Security: origin allowlist, payload validation, no `eval`-style escape hatches

Out:
- Production embedding in a real third-party host (that's post-1.0)

### Deliverables

- Protocol spec in `packages/alistigo-host-protocol/`
- Reference host demo
- `packages/alistigo-features/features/host-protocol/` feature group covering the message exchange end-to-end (with a matching `@host-protocol` group tag)

---

## M6 / 1.0.0 — Public Beta

**Goal:** ship something an external AI chat surface (or LLM artifact runner) can embed today.

Scope decisions deferred — re-plan after M5 ships and we have signal from real embed attempts. Likely topics:

- Documentation site
- npm publishing (`@alistigo/*`)
- Versioning and migration policy for the document format
- A "create a list" generator prompt template for LLMs
- Telemetry-free analytics (or none)

---

## How a Milestone is Considered Done

1. All `.feature` scenarios in the milestone's folder are green via the runner
2. **The event log replays into the same projection at the end of every scenario** (replay-equivalence property)
3. `pnpm typecheck && pnpm nx qa:lint && pnpm test` clean across affected packages
4. The milestone's deliverables exist at the documented paths
5. [README.md](README.md) progress table is updated
6. [changelog.md](changelog.md) entry added with the version bump
