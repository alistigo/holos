# @alistigo/artifact-storage-explorer

A Claude artifact that lets developers inspect, create, edit, and delete entries from `window.storage` — the key-value API that Claude injects into every artifact iframe.

## Why this exists

Every HTML artifact Claude generates runs in an iframe. Before it loads, Claude injects a small bridge script that wires up a few APIs your JavaScript can call — including `window.storage`. It's a promise-based key-value store backed by the conversation: `get`, `set`, `delete`, `list`. Private namespace (scoped to your artifact) and a shared namespace (available across artifacts in the same conversation).

We'd been using it for persistence in `@alistigo/artifact-list`. But we had no way to see what was actually accumulating in there. No inspector, no reset, nothing.

So we built one.

## What it does

A split-pane explorer for Claude artifact storage:

- **Browse** — lists all private and shared keys in separate sections, filtered by an optional prefix
- **Inspect** — click any key to see its JSON value in an editable panel
- **Create** — add a new entry; key name is editable inline, default value is `{}`
- **Edit** — modify the JSON value directly; changes are auto-saved after a 1-second debounce. The key shows its state: `draft` while typing, `saving` during the write, then returns to clean.
- **Delete** — remove individual keys with a single click

## Usage

Paste the script tag into a Claude HTML artifact:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-storage-explorer/dist/index.umd.js"></script>
```

The artifact auto-mounts to a full-height container it creates in `<body>`. To target an existing element, add a config block before the script:

```html
<script id="alistigo-config" type="application/json">
  { "app": "@alistigo/artifact-storage-explorer" }
</script>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-storage-explorer/dist/index.umd.js"></script>
```

## Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter both private and shared keys to those starting with this prefix |
| `container` | `string` | auto-created `<div>` | CSS selector for the mount target element |

### With prefix filter

```html
<script id="alistigo-config" type="application/json">
  {
    "app": "@alistigo/artifact-storage-explorer",
    "prefix": "myapp:"
  }
</script>
```

## How it works

On mount, calls `window.storage.list(prefix, false)` for private keys and `window.storage.list(prefix, true)` for shared keys in parallel. Both lists reload on prefix change or after any write operation.

- **Creating an entry** calls `window.storage.set(key, {}, isShared)` then reloads the list.
- **Editing a value** calls `window.storage.set(key, parsedValue, isShared)` after a 1-second debounce — no manual save button needed.
- **Deleting an entry** calls `window.storage.delete(key, isShared)` then reloads.

## Limitations

- Only works inside a Claude artifact iframe — `window.storage` is only available via the Claude inject-script bridge.
- Bulk operations (select-all delete, export) are not supported.
