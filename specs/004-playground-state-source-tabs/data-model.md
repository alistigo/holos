# Phase 1 Data Model: Playground State Persistence & Source Tabs

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-18

Three models: what gets persisted, what the address can override, and how the injected document
is cut into segments. None of them is an Alistigo document — this is dev-tool state, so JSON-LD,
TypeID and the event-sourcing rules of Principle III do not apply (see the Constitution Check).

---

## 1. `Config` — the existing form state (unchanged shape)

Already defined in `src/hooks/useHostConfig.ts` and already the sole input to the srcdoc builder.
This feature persists it; it does not change it.

| Field | Type | Form section | Persisted | Validation on restore |
|-------|------|--------------|-----------|------------------------|
| `app` | `string` | Global artifact config → *Artifact* | yes | must be a key of `ARTIFACT_REGISTRY`; else default |
| `lang` | `string` | Global artifact config → *Language* | yes | non-empty string; else `"en"` |
| `aiContext` | `string` | Playground config → *AI Context* | yes | must be in `AI_CONTEXTS`; else `"claude"` |
| `readonly` | `boolean` | Global artifact config → *Read-only* | yes | must be boolean; else `false` |
| `document` | `string` | Artifact config → *Document* | yes | `""`, `"__raw__"`, or a known fixture name **for the restored `app`**; else `""` |
| `rawMarkdown` | `string` | Artifact config → raw markdown textarea | yes | must be a string; else `""` |
| `plugins` | `Record<string, Record<string, unknown>>` | Artifact config → *Plugins* + per-plugin config | yes | each key must be in `getAvailablePlugins(restored app)`; unknown keys dropped; each value must be a plain object, else `{}` |
| `published` | `boolean` | Claude Simulator → *Published* | yes | must be boolean; else `true` |
| `mode` | `"dev" \| "prod-local"` | Playground config → *Source* | yes | must be one of the two; in a production build, forced to the build default since the field is not offered |

**Not persisted** (session-scoped tooling, per the spec's assumptions): the simulator's
`simulatorDelayMs`, `suppressResponses`, canned response, error mode, and every log buffer; the
left panel's and the preview panel's active tab; the iframe `reloadKey`.

**Validation order is significant**: `app` resolves first, because `document` and `plugins` are
both validated against the artifact that `app` names. Restoring `plugins` against the *default*
artifact rather than the restored one would keep plugin keys the chosen artifact cannot load.

---

## 2. `PersistedPlaygroundState` — the storage envelope

```text
Key:   "dev-playground:config:v1"          (localStorage, playground origin)
Value: { "v": 1, "config": <Config> }      (JSON)
```

| Field | Type | Meaning |
|-------|------|---------|
| `v` | `1` | Envelope version. Any other value (or a missing `v`) ⇒ discard the whole entry and use defaults. |
| `config` | `Config` | The form state as written. Fields are trusted only after the sanitisation in §1. |

**Rules**

- **R-1** The key MUST NOT start with `alistigo` (FR-006) — `useLocalStorageEntries` lists
  `startsWith("alistigo")` keys and presents them as the artifact's own storage.
- **R-2** One write per committed form change; the whole envelope is rewritten (no partial write).
- **R-3** Every read and write is wrapped so that a throw (private mode, quota, disabled storage)
  degrades to "no persistence" and never prevents the app from rendering (FR-005).
- **R-4** Malformed JSON, a non-object `config`, or an unknown `v` ⇒ defaults, no error surfaced
  to the developer.
- **R-5** The envelope version is bumped only when a shape change cannot be handled by the
  field-level fallbacks in §1.
- **R-6** The envelope is re-written after the Clear Data control runs, which clears the whole
  storage area the artifact shares with the playground (FR-022).

**Lifecycle**

```text
load:    read key → JSON.parse → version gate → sanitise per §1 → Partial<Config>
compose: defaults ◁ sanitised stored ◁ url overrides (§3) → initial Config
change:  Config → { v: 1, config } → JSON.stringify → write key
cleared: key absent (fresh browser context, or localStorage.clear() from the e2e harness)
         → defaults, app still fully functional
wiped:   Clear Data runs an origin-wide clear (the srcdoc iframe is same-origin), removing this
         key while Config is unchanged → the hook re-writes the envelope at once (FR-022, H-5)
```

---

## 3. `UrlOverrides` — what the address may set

```text
?artifact=<artifact>&source=<dev|prod-local>
```

| Parameter | Maps to | Accepted values | Invalid value |
|-----------|---------|-----------------|---------------|
| `artifact` | `Config.app` | a full registry key (`@alistigo/artifact-list`), or a unique suffix of one (`artifact-list`, `list`) | ignored; stored or default value is kept (FR-010) |
| `source` | `Config.mode` | `dev`, `prod-local` (also `prod local`, `prod_local`) | ignored |

**Rules**

- **R-7** Read exactly once, when the initial state is computed. Never re-read, so a later form
  change is final (FR-011).
- **R-8** Beats the stored value for its own field only; every other field keeps what storage gave
  (FR-009).
- **R-9** `source` is only meaningful where the *Source* field exists (development). In a
  production build it is parsed and then discarded, without error (FR-008 + edge case).
- **R-10** The application never writes to its own address.
- **R-11** An override, once applied, is indistinguishable from a developer's own selection — in
  particular it is persisted by the next write, so it survives the next reload.

---

## 4. `SrcdocPart` / `SrcdocSegment` — the injected document, cut up

```text
SrcdocSegment = "playground" | "ai-bridge" | "artifact" | "config" | "ai-input"
SrcdocPart    = { segment: SrcdocSegment; text: string }
```

The builder returns `SrcdocPart[]` in document order. Two derivations:

| Derivation | Definition | Used by |
|-----------|------------|---------|
| whole document | `parts.map(p => p.text).join("")` | the iframe `srcDoc`, and the **Source** tab |
| one segment | `parts.filter(p => p.segment === s).map(p => p.text).join("\n")` | the **AI Bridge**, **Artifact source**, **Playground source** tabs |

**Invariants** (each one a test):

- **I-1 Completeness** — every part carries a segment; no text in the assembled document belongs
  to no segment. (FR-017, first half.)
- **I-2 Non-duplication** — a part has exactly one segment, so no text can appear under two tabs.
  (FR-017, second half.)
- **I-2a Presentation** — the three new tabs render their segment's text verbatim; Config and AI
  Input render theirs in readable form (structured configuration, plain markdown) and still own it
  for I-1/I-2 purposes. (FR-023.)
- **I-3 Byte-identity** — for any given options, the assembled document equals the string the
  pre-refactor builder produced, character for character, whitespace included. (FR-019 protection.)
- **I-4 Ordering** — parts are returned in document order, so a segment's rendered text reads
  top-to-bottom as it appears in the page.
- **I-5 Context sensitivity** — with `aiContext` ≠ `claude`, the `ai-bridge` segment has no parts
  (which is what makes FR-013's empty-state message appear); with no AI input, the `ai-input`
  segment has no parts.

**Segment → tab mapping**

| Segment | Tab | Rendered by |
|---------|-----|-------------|
| `playground` | Playground source | `SourceView` (syntax-coloured, copyable) |
| `ai-bridge` | AI Bridge | `SourceView`, with an empty-state message when the segment is empty |
| `artifact` | Artifact source | `SourceView` |
| `config` | Config *(existing)* | `JsonPanel` — structured view of the same configuration the segment carries |
| `ai-input` | AI Input *(existing)* | `AiInputPanel` — the markdown the segment wraps |
| *all, assembled* | Source *(existing)* | `SourceView`, unchanged behaviour |

The two existing non-code tabs keep their readable presentations and still own their segment for
I-1/I-2 purposes (FR-023).
