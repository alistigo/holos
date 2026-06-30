---
name: artifact-list
app: "@alistigo/artifact-list"
description: >
  Embed the Alistigo list widget — an interactive, persistent list/checklist
  powered by AlistigoDocument. Use via @alistigo/artifact-manager.
triggers:
  - "add a list"
  - "create a checklist"
  - "embed a list widget"
  - "show a to-do list"
  - "create a task list"
  - "interactive list"
  - "@alistigo/artifact-list"
---

# @alistigo/artifact-list — AI usage guide

## When to use

Renders an interactive, editable list with persistent storage (`window.storage` in Claude,
`localStorage` elsewhere). Use whenever the user asks to track tasks, items, or a checklist
inside a Claude HTML artifact.

## Config fields

App-specific fields — add these inside the manager config alongside `app`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `readonly` | `boolean` | `false` | Prevents user edits when `true` |
| `document` | `AlistigoDocument` | empty list | Pre-seeded list content |

## AlistigoDocument format

The `document` field pre-seeds the list. It is a JSON-LD object with an `alistigo:listEventLog`
array: one `ListCreated` event, then one `ListElementAdded` event per item.

See [references/document-format.md](references/document-format.md) for the full format spec,
ID prefix conventions, and a complete example.
