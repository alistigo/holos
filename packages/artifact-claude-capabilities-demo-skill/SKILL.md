---
name: alistigo-artifact-claude-capabilities-demo-skill
app: "@alistigo/artifact-claude-capabilities-demo"
description: >
  Use this when a developer asks to demo, explore, or inspect Claude artifact iframe APIs.
  Renders a tabbed UI demonstrating storage, AI completions, file download, network proxy,
  and external navigation — all inside a Claude artifact.
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
  - "demo claude artifact capabilities"
  - "show all claude artifact APIs"
  - "artifact capabilities demo"
  - "show window.claude.complete"
  - "call claude from an artifact"
  - "download file from artifact"
  - "artifact file generation"
  - "artifact network demo"
  - "test window.fetch in artifact"
  - "artifact external links"
  - "window.open in artifact"
---

# @alistigo/artifact-claude-capabilities-demo — AI usage guide

## When to use

Renders a five-tab demo artifact that showcases every Claude iframe API. Use it whenever a
developer wants to explore, debug, or demonstrate any of the APIs Claude injects into artifact
iframes: `window.storage`, `window.claude.complete`, `URL.createObjectURL`, `window.fetch`, or
`window.open`.

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys to those starting with this prefix |
| `defaultTab` | `string` | `"storage"` | Which tab opens first (`"storage"`, `"ai"`, `"file-generation"`, `"api-calls"`, `"external-navigation"`) |

## Minimal config

```json
{
  "app": "@alistigo/artifact-claude-capabilities-demo"
}
```

## Config with options

```json
{
  "app": "@alistigo/artifact-claude-capabilities-demo",
  "prefix": "myapp:",
  "defaultTab": "ai"
}
```

## Tab descriptions

### Storage (`window.storage`)

Calls `window.storage.list(prefix, false)` for private keys and
`window.storage.list(prefix, true)` for shared keys in parallel. Displays all key-value pairs,
allows clicking any key to view/edit its JSON value (auto-saved after 1 s), create new entries,
and delete individual keys.

In **draft mode** this tab is overlaid — `window.storage` is version-siloed and write-blocked
in the AI preview panel. The other four tabs work normally in draft.

### AI (`window.claude.complete`)

Textarea for a prompt + "Ask Claude" button. Submitting pushes a pending row into a request
history list, calls `window.claude.complete(prompt)`, then resolves to a result or error row.
Demonstrates the synchronous LLM completion API available inside every Claude artifact.

### File Generation (`URL.createObjectURL`)

JSON textarea editor (pre-filled with sample data) + "Download JSON" button. Clicking creates
a `Blob`, calls `URL.createObjectURL`, sets `a.href` and `a.download = "export.json"`, triggers
a click, then revokes the URL. The Claude inject-script intercepts `blob-request://` URLs and
routes the download through the parent frame.

### API Calls (`window.fetch`)

Form with URL, method (GET/POST/PUT/DELETE/PATCH), optional key-value headers, and a body
textarea (shown for non-GET methods). Submitting calls `fetch(url, { method, headers, body })`
via the Claude network proxy. A call history shows pending (spinner), result (status code +
truncated body), or error rows. Pre-filled with `https://httpbin.org/get` for instant demo use.

### External Navigation (`<a>` + `window.open`)

A curated list of `<a target="_blank">` links (MDN, Anthropic docs, GitHub, npm, Tailwind CSS)
to demonstrate link interception. Also includes a URL input + "Open in new tab" button that
calls `window.open(url)`. Both paths route through the inject-script to open in the parent frame,
working around the iframe sandbox restriction on navigation.

## Draft mode behavior

Only the **Storage tab** is blocked in draft mode. The overlay explains why and links to the
detail modal. The other four tabs (`ai`, `file-generation`, `api-calls`, `external-navigation`)
are fully functional in both draft and published mode. A `DraftBadge` in the context menu
header remains visible on all tabs as a reminder.

## What this artifact cannot do

- **Bulk delete storage keys** — only individual key deletion is supported
- **Work outside a Claude artifact** — all five APIs are injected by the Claude iframe bridge and
  are not available in a plain browser tab

## NPM

```
@alistigo/artifact-claude-capabilities-demo
```

Published on npm. Paste the jsDelivr CDN script tag into a Claude artifact to demo all five
Claude iframe APIs without leaving the conversation.
