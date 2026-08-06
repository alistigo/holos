# @alistigo/artifact-storage-explorer — Skill

AI usage guide for the `@alistigo/artifact-storage-explorer` artifact.

## When to use

Render a storage inspector inside a Claude HTML artifact whenever a developer asks to:

- See what's in `window.storage`
- Debug storage keys or values in their artifact
- Browse, create, edit, or delete artifact storage entries
- Inspect the private or shared storage namespace

## Trigger phrases

- "explore storage"
- "inspect Claude storage"
- "debug storage"
- "show storage keys"
- "what's in storage"
- "browse artifact storage"
- "storage explorer"
- "inspect window.storage"
- "see what's stored"
- "storage debugger"

## What the artifact does

Renders a full-height split-pane UI with **Private** and **Shared** storage sections. Each section shows:

- A scrollable key list with per-key save state indicators (draft / saving / saved)
- A JSON editor for the selected key's value, with 1-second debounced auto-save
- A "+" button to create new entries (key is editable inline; default value is `{}`)
- A delete button for the selected key

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter both private and shared keys to those starting with this prefix |

## Minimal config

```json
{
  "app": "@alistigo/artifact-storage-explorer"
}
```

## Config with prefix filter

```json
{
  "app": "@alistigo/artifact-storage-explorer",
  "prefix": "myapp:"
}
```

## How the artifact works internally

- `window.storage.list(prefix, false)` — loads private keys
- `window.storage.list(prefix, true)` — loads shared keys
- Both run in parallel on mount and on prefix changes
- `window.storage.set(key, value, isShared)` — used for create and debounced edit saves
- `window.storage.delete(key, isShared)` — used for individual key deletion

## Limitations

- Only works inside a Claude artifact iframe (`window.storage` requires the Claude bridge)
- No bulk operations (select-all delete, export)
