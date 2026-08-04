---
name: alistigo-artifact-storage-explorer-skill
app: "@alistigo/artifact-storage-explorer"
description: >
  Use this when a developer asks to inspect, browse, debug, or explore Claude artifact storage.
  Renders a storage explorer UI inside the artifact that lists all private and shared storage keys
  with their JSON values, and allows creating, editing, and deleting individual keys.
triggers:
  - "explore storage"
  - "inspect claude storage"
  - "debug storage"
  - "show storage keys"
  - "what's in storage"
  - "browse artifact storage"
  - "storage explorer"
  - "inspect window.storage"
  - "see what's stored"
  - "storage debugger"
---

# @alistigo/artifact-storage-explorer — AI usage guide

## When to use

Renders a storage inspection UI inside a Claude HTML artifact. Use whenever a developer asks to
see, debug, or clean up what's stored in `window.storage` — the key-value API that Claude injects
into every artifact iframe.

The artifact displays private and shared keys in separate sections, lets the developer click any
key to view and edit its JSON value (auto-saved after 1 second), create new entries, and delete
individual keys. A prefix field at the top filters both lists simultaneously.

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

## How it works

The artifact calls `window.storage.list(prefix, false)` for private keys and
`window.storage.list(prefix, true)` for shared keys. Both calls happen in parallel on mount
and whenever the prefix field changes. The `list` API returns a `Record<string, unknown>` of
all matching key-value pairs — no separate `get` call is needed for the initial view.

Clicking delete calls `window.storage.delete(key, isShared)` then reloads both lists.

## What this artifact cannot do

- **Bulk delete** — only individual key deletion is supported
- **Work outside a Claude artifact** — `window.storage` is only available inside the Claude inject-script bridge

## NPM

```
@alistigo/artifact-storage-explorer
```

Published on npm. Usable by any developer — paste the CDN script tag into a Claude artifact to
inspect storage without leaving the conversation.
