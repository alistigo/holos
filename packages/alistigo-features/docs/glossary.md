# Glossary — Ubiquitous Language

The words allowed in step text and the domain concepts they refer to. If a word isn't here, it shouldn't be in a `.feature`. The glossary is the contract between **product**, **specs**, and **code** — following it is what makes a Gherkin scenario unambiguous.

The glossary has three sections, in this order: **Entities**, **Actors**, **Actions**. (Per the [`gherkin-features` skill](../../../.agents/skills/gherkin-features/SKILL.md), this structure is universal across features packages — the contents are project-specific.)

---

## 1. Entities

Things that live in the data layer. Each entity has a **definition** and a list of **rules** (domain invariants that must always be true).

### List

A collection of Elements. The fundamental container of the Alistigo app. One viewer shows exactly one List.

**Rules:**
- A List has zero or more Elements.
- Elements have an internal order; this order is preserved across reads.
- The internal order is **NOT semantically meaningful** in the base list. Renderers are free to ignore it.
- A List has a stable `@id` (UUIDv7 URN). Identity does not change across renames.

### Element

A single addressable item within a List. In the base list, an Element holds plain text and nothing else.

**Rules:**
- An Element has a stable `@id` (UUIDv7 URN). Identity is preserved across edits.
- An Element has `text` content. Text is non-empty (whitespace-only is rejected).
- Two Elements may share the same `text`. They are still **two distinct Elements** with distinct identities.
- An Element has an internal `position` within its containing List. Positions are 1-based, contiguous.
- Adding an Element appends it at the end of the internal order.
- Deleting an Element removes that *specific identity* — duplicates with the same text are unaffected unless explicitly addressed.

### Document

The JSON-LD projection of a List — what gets rendered, exported, and shown to consumers.

**Rules:**
- The Document can be recomputed from the Event log; The source of truth is the event log if event log is present.
- The Document conforms to [`@alistigo/document-format`](../../alistigo-document-format/docs/spec.md).
- A Document carries a `formatVersion`; mutations are disabled when the version is newer than the library knows.

### Event

An immutable, append-only record of a mutation, persisted in the event log.

**Rules:**
- Events are never edited or deleted.
- Events have a stable `@id` (UUIDv7) and a per-list `seq` (monotonic, contiguous from 0).
- Replaying the events from `seq=0` reproduces the current Document.
- The first event for a List is always `ListCreated`.
- See [`projects/alistigo-ai/architecture.md` §5](../../../projects/alistigo-ai/architecture.md#5-event-sourcing--cqrs) for the full contract.

### Row

The visual rendering of an Element in the UI. A row corresponds 1:1 with an Element. **Rows are visible to the user; positions are not displayed.**

**Rules:**
- Rows are numbered 1-based for the purposes of step text (`row 1`, `row 2`, …) — even though the user does not see those numbers in the UI.
- Row numbering reflects the internal order of Elements at the moment the scenario asserts.
- A row never refers to anything other than an Element of the current list.

(`Row` is the Gherkin-only handle for disambiguating duplicates; the data layer only knows about Elements.)

### Plugin

A composable extension to an artifact, implementing the `AlistigoPlugin` interface
from `@alistigo/artifact-plugin-api`. Distributed as its own independently-versioned
npm package and loaded dynamically at runtime — never bundled into the artifact.

**Rules:**
- A Plugin's `name` matches its own npm package name.
- A Plugin is enabled by naming it under a config document's `plugins` field.
- A Plugin may implement lifecycle hooks (`setup`, `beforeMount`, `mounted`, `destroy`)
  and may subscribe to events emitted by the Host.
- A Plugin that fails — missing configuration, a thrown error in any hook — never
  breaks the Host's mount or another Plugin.

---

## 2. Actors

Who triggers scenarios. Each Actor has a paragraph describing who they are and the kind of action they take.

### User

A human looking at the list. The User adds and deletes Elements directly via the UI. This is the only Actor present in M1; the User is implied when no `@actor:*` tag is present.

### Host

The artifact itself, acting on its own during boot and mount — not a human. The Host
loads configured Plugins, drives their lifecycle hooks, and emits events (e.g.
`widget:displayed`, `error:uncaught`) that Plugins may subscribe to. Scenarios tagged
`@actor:host` describe this internal, non-user-triggered behavior.

(Future Actors — AI, System — will arrive with M4 and the host protocol.)

---

## 3. Actions

The verbs allowed in step text. Each row lists the verb, what it means, and points to the canonical phrasings further below.

| Verb | Means |
|------|-------|
| **open** the list | Show the list in the viewer. Implicit before any other action — see "Implicit open" below. |
| **add** an element | Append a new Element with the given text |
| **delete** an element | Remove an Element by identity (or by row when duplicates make identity ambiguous) |
| **reload** the list | Close and reopen the list, forcing the projection to be rebuilt from the event log |
| **open** the page | Load an Alistigo page in the browser. The trigger for auto-mount. |
| **provide** a document | Supply an `AlistigoDocument` to the widget. |
| **enable** a plugin | Name a Plugin under the config document's `plugins` field |
| **boot** | Run the Host's mount() lifecycle to completion |

### Implicit open

Every action scenario implicitly begins with the User opening the list. The runner performs the open step before any `When I add`, `When I delete`, etc. — even when `When I open the list` is not written.

**Write the open step explicitly only when:**

- The scenario is *about* the open/display behavior itself (e.g. [`display-list.feature`](../features/core/display-list.feature) asserts what the User sees at open time — empty state, populated rendering, duplicates).
- You need to assert something between opening and another action (rare; usually a smell that the scenario is doing two things).

For everything else (`add-element`, `delete-element`, `persist`, …), start the `When` block with the action under test. Opening is plumbing the runner does on your behalf; spelling it out is noise.

```gherkin
# ✅ implicit open — action under test is the add
Scenario: Add to an empty list
  Given an empty list
  When I add "Buy bread"
  Then the list should be:
    | Buy bread |

# ✅ explicit open — display behavior IS the action under test
Scenario: An empty list shows an empty state
  Given an empty list
  When I open the list
  Then the list should be empty
  And an empty-state message should be visible
```

The same rule applies to `reload`: `When I reload the list` is a re-open and is always written explicitly (it's the action under test in any reload scenario).

### Canonical phrasings (copy verbatim)

These are the exact sentences. Step definitions match against them. Don't paraphrase; reuse.

Two style rules drive these phrasings:

1. **Tables for collections**, even single-row. `Given a list:` + a headerless one-column table is the canonical setup form, scaling 1 → N without changing shape. Never write `Given a list with element "X"`.
2. **Drop the entity noun when the verb makes it unambiguous.** `When I add "X"` not `When I add an element "X"`. The Element entity is implied by the operation; spelling it out adds noise.

```gherkin
# Givens — set up state
Given an empty list
Given a list:
  | ...      |
  | (1 or N) |

# Whens — actions
When I open the list
When I add "..."
When I delete "..."
When I delete row N
When I reload the list

# Thens — assertions about the list
Then the list should be empty
Then the list should be:                       # full-state assertion (multiset, order-insensitive)
  | ... |
Then the list should contain "..."             # presence
Then the list should not contain "..."         # absence
Then the list should contain N occurrence of "..."
Then the list should contain N occurrences of "..."

# Thens — UI feedback
Then an empty-state message should be visible
Then no error should be displayed
```

#### Notes on the canonical forms

- **`Given a list:` and `Then the list should be:` use the same headerless table format.** A list is a sequence of texts; naming the column adds nothing.
- **`Then the list should be:` is a multiset assertion** — order-insensitive, multiplicity-sensitive. `[a, b, a]` matches `[a, a, b]`. This reflects the rule that element order is internal but not semantically meaningful.
- **No `should contain N elements` form.** Asserting "exactly N" without the values is a weak test; replace with the table form, which asserts strictly more (the values *and* the count).
- **`row N`** is the *only* place where positions appear in step text — used to disambiguate which duplicate to operate on. Rows are visible to the User but unnumbered in the UI; the number is a Gherkin-only handle.

---

## What NOT to use

- ❌ "click", "type", "press", "tap" — UI verbs, not domain verbs.
- ❌ "checkbox", "input", "button", "form", "row N" *as a UI selector* — use the Entities defined above. (`row N` is allowed only as a disambiguator, never as a UI element.)
- ❌ "save" — implies user-triggered persistence; the event log is appended automatically.
- ❌ "task", "todo", "item" — we use **Element**. The list type *may* be called "todo" once the todo plugin lands, but an entry is always an *Element*.
- ❌ "tick", "check off", "mark done" — these are todo-plugin verbs that don't exist in the base list.

---

## Adding a term

1. Decide the section: Entity / Actor / Action.
2. If Entity → write a one-paragraph definition AND at least one rule.
3. If Action → add a row to the Actions table AND a canonical phrasing.
4. If the term is also a tag, update [`tags.md`](tags.md) and [`../src/tags.ts`](../src/tags.ts).
5. Run `pnpm format && pnpm nx qa:lint && pnpm validate` to confirm consistency.
