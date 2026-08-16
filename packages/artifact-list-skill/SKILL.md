---
name: alistigo-artifact-list-skill
app: "@alistigo/artifact-list"
description: >
  Use this when user need a list of any kind: todo, checklist, tasklist. Build an artifact with a list viewer/editor.
triggers:
  - "add a list"
  - "create a checklist"
  - "show a to-do list"
  - "create a task list"
  - "interactive list"
---

# @alistigo/artifact-list — AI usage guide

## When to use

Renders an interactive, editable list with persistent storage (`window.storage` in Claude,
`localStorage` elsewhere). Use whenever the user asks to track tasks, items, or a checklist
inside a Claude HTML artifact.

## How to write the artifact

The artifact auto-mounts when the script loads — no JavaScript call needed. Provide the list
content as markdown inside a `<script id="ai-input-action" type="text/markdown">` tag.

### Minimal example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script id="ai-input-action" type="text/markdown">
Groceries:
- Milk
- Bread
- Eggs
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@latest/dist/index.umd.js"></script>
</head>
<body></body>
</html>
```

## Markdown format for `#ai-input-action`

The first line **must** end with `:` — that becomes the list title.
Each subsequent line starting with `-` (unordered) or `1.` / `2.` … (ordered) is a list item.

### Unordered list

```markdown
Shopping list:
- Apples
- 2 kg of rice
- Paper towels
```

### Ordered list

```markdown
Top films:
1. Avengers Doomsday
2. Back to the Future
3. Inception
```

### Items with metadata

Lines between items that match `Key: value` are attached to the preceding item as metadata:

```markdown
My best songs:
1. Bohemian Rhapsody
Why: A masterpiece.
Length: 6min
2. Hotel California
Why: Timeless.
```

## Config fields

The `<script type="application/json" id="alistigo-config">` tag is **optional**. Omit it entirely when the defaults are sufficient. Add it only when you need to override a field:

```html
<script type="application/json" id="alistigo-config">
  { "app": "@alistigo/artifact-list", "readonly": true }
</script>
```

Available fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `app` | `string` | `"@alistigo/artifact-list"` | Disambiguates multi-app pages; safe to omit in single-app artifacts |
| `readonly` | `boolean` | `false` | Lock the list against user edits |
| `plugins` | `object` | `{}` | Plugin config keyed by npm package name |

## Draft vs published behavior

- **Draft** (AI preview panel): list is visible and read-only. A banner tells the user to publish.
- **Published**: list is fully interactive. User edits are persisted to `window.storage`.

Do not set `readonly: true` to simulate draft — draft detection is automatic.

## What to avoid

- Do **not** call `Alistigo.mount()` — auto-mount runs when the script loads.
- Do **not** inject a `<script id="alistigo-document">` JSON tag — use `#ai-input-action` markdown instead.
- Do **not** write `window.storage` calls yourself — storage is managed by the artifact runtime.
