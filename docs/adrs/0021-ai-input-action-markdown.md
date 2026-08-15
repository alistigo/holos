# ADR-0021: AI Input Action — Markdown as Document Source Format

**Status:** Accepted
**Date:** 2026-08-15

## Context

### Previous approach: JSON-LD document injected directly

When AI writes a list artifact, it previously had to inject a full `AlistigoDocument` JSON-LD object
into a `<script id="alistigo-document" type="application/json">` tag. This format is:

- **Complex**: the AI needs to generate typed IDs (`lst_*`, `lev_*`, `act_*`), event-log entries,
  schema.org context, timestamps, etc.
- **Error-prone**: any malformed JSON or missing required field produces a broken artifact with no
  user-visible explanation.
- **Fragile**: the document schema evolves; AI instructions are hard to keep in sync.

### Previous approach: explicit `mount()` call

The bundle also exposed `Alistigo.mount()` as an explicit mounting API. AI was documented as being
able to call it with a document option. Now that auto-mount runs unconditionally on bundle load, this
explicit API is no longer needed in the AI authoring context.

### AI API project — why it is removed

A project called "AI API" (`@alistigo/ai-chat-async-api`) was designed to let AI call artifact
operations (e.g. `addElement`) via `postMessage` by injecting action descriptors into the HTML of a
new artifact version. The core assumption was that all artifact versions and the published artifact
share the same `window.storage` namespace, so the AI's changes would propagate to the user's view.

Investigation documented in [ADR-0019](0019-claude-artifact-draft-vs-published.md) revealed that
**Claude's `window.storage` is version-siloed**: each regeneration of an artifact creates a new
version with a separate storage namespace. Version A1-v1 and A1-v2 cannot read each other's data.
This makes the shared-storage channel that "AI API" relied on impossible to implement within Claude's
artifact sandbox. The project is therefore **deleted**.

## Decision

### 1. Markdown as the AI-authored document format

AI writes the list content as a `<script>` tag with `type="text/markdown"` and `id="ai-input-action"`:

```html
<script id="ai-input-action" type="text/markdown">
List of groceries:
- 4 Sugar packets
- 2 Rice
- 8 paper towels
</script>
```

Supported markdown structures:

| Format | Semantics |
|--------|-----------|
| `Title:\n- item\n- item` | Unordered list with named items |
| `Title:\n1. item\n2. item` | Ordered list (position stored) |
| `Title:\n1. item\nKey: value\n2. item` | Items with key-value metadata pairs |

The first line ending with `:` is the list title. Each subsequent bullet (`-`) or numbered item
(`1.`) opens a new list element. Lines between items that match `Key: value` are treated as metadata
attached to the preceding element (stored, displayed when supported by the renderer).

### 2. Boot flow: AiInputAction

```
┌─────────────────────────────────────────────────────────────┐
│  Browser loads artifact HTML                                 │
│                                                              │
│  1. Bundle script tag executes → auto-mount fires           │
│                                                              │
│  2. readAiInputAction()                                      │
│     ├─ find <script id="ai-input-action">                    │
│     ├─ detect type attribute                                 │
│     │   ├─ "text/markdown" → proceed                        │
│     │   └─ other            → log error, use empty default  │
│     ├─ parseMarkdownToDocument(markdown)                     │
│     │   ├─ extract title from first line                     │
│     │   ├─ extract items (unordered or ordered)             │
│     │   └─ attach key-value metadata to items               │
│     ├─ validateAsListDocument(doc)                           │
│     │   ├─ OK  → AlistigoDocument                           │
│     │   └─ FAIL → log error, use empty default              │
│     └─ remove <script id="ai-input-action"> from DOM        │
│                                                              │
│  3. Mount React tree with resolved document                  │
└─────────────────────────────────────────────────────────────┘
```

The AI input tag is **removed from the DOM after being read** — it was a one-time seed, not a
persistent data store.

### 3. Storage is lazy — only activated by user edits

Previously, the artifact called `seedIfEmpty(initialDocument)` at mount time, writing the initial
document to `window.storage` even if the user never interacted with it. This caused:

- Silent writes in draft mode (storage is version-siloed, so data is immediately lost anyway).
- Misleading storage-explorer state showing "data" that will never survive a regeneration.

**New rule:** Storage is never touched at mount time. The first user action (add/delete element)
triggers lazy initialization: the document is written to storage at that point, then the action is
applied. Subsequent actions update storage as before.

```
Mount
  │
  ├─ Render document from AiInputAction (in-memory only)
  │
  └─ User performs first edit
       │
       ├─ seedIfEmpty(currentDocument) → initialize storage
       └─ apply edit → save to storage
```

On subsequent loads of the same published artifact, storage takes priority over the AI input (the
user's edits are preserved).

### 4. Draft mode: visible but read-only

Previously in draft mode (artifact not yet published) the artifact was not rendered at all, which
made it appear broken. Now:

- **Draft mode**: artifact renders, shows the list content, but user cannot perform any edit actions.
  A sticky banner at the top explains: _"This list is a preview — publish it to start editing."_
- **Published mode**: banner is removed, all edit actions (add, delete) are enabled.

Draft detection uses the existing `artifactContext()` utility from `@alistigo/claude-artifact-api`
(see ADR-0019). In the playground, the **Published** toggle controls draft vs. published simulation.

```
Draft mode:
┌──────────────────────────────────────────────────────┐
│ ⚠ Preview — Publish this artifact to start editing   │
├──────────────────────────────────────────────────────┤
│  [List content — read-only, no input, no delete]     │
└──────────────────────────────────────────────────────┘

Published mode:
┌──────────────────────────────────────────────────────┐
│  [List content — fully interactive]                   │
└──────────────────────────────────────────────────────┘
```

### 5. Remove explicit `mount()` API from AI skill documentation

`Alistigo.mount()` still exists in the bundle (for advanced/programmatic use) but is removed from
the AI skill guide. All artifacts now auto-mount from the `#alistigo-config` and `#ai-input-action`
tags. AI does not call `mount()`.

### 6. Remove AI API tab from the playground

The playground's "AI API" tab, `AiApiTab` component, `useApiSimulator` hook, and the
`@alistigo/ai-chat-async-api` package dependency are removed. The tab provided a UI to simulate
sending API calls from AI into the artifact — a feature made impossible by version-siloed storage
(see above).

## Rationale

- **Markdown is LLM-native**: AI models produce clean markdown without prompting; JSON-LD with typed
  IDs is error-prone and requires careful prompting to get right.
- **Simpler contract**: the AI skill guide shrinks to "write a markdown list in a `<script>` tag" —
  no schema, no event log, no IDs.
- **Lazy storage avoids phantom writes**: draft-mode artifacts no longer silently write data that
  disappears on the next regeneration.
- **Draft banner replaces invisible state**: users see their list immediately (even in preview),
  which confirms the artifact is working and signals what to do next (publish it).

## Consequences

- The `#alistigo-document` JSON injection path in `auto-mount.ts` is removed. Existing artifacts
  that embed JSON-LD via `#alistigo-document` will no longer have their document read on load. This
  is an intentional breaking change — the new format is simpler and all new AI-authored artifacts
  will use `#ai-input-action`.
- `@alistigo/ai-chat-async-api` package stays in the monorepo (other dependents may exist) but
  its dependency is dropped from the playground and artifact.
- `ListKeyValueAdapter.seedIfEmpty()` is kept for backward compatibility but is no longer called at
  mount time; it is only called inside the action dispatch path on first user edit.
- The playground's "AI API" tab is permanently removed.
