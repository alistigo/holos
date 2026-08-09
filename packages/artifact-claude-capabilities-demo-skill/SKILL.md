---
name: alistigo-artifact-claude-capabilities-demo-skill
app: "@alistigo/artifact-claude-capabilities-demo"
description: >
  Use this when a developer asks to demo, explore, or inspect Claude artifact iframe APIs.
  Renders a tabbed UI demonstrating storage, AI completions, file download, network proxy,
  external navigation, and postMessage bridge inspection — all inside a Claude artifact.
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
  - "postmessage log"
  - "inspect postmessage"
  - "artifact bridge traffic"
---

# @alistigo/artifact-claude-capabilities-demo — AI usage guide

## When to use

Renders an eight-tab demo artifact that showcases every Claude iframe API. Use it whenever a
developer wants to explore, debug, or demonstrate any of the APIs Claude injects into artifact
iframes: `window.storage`, `window.claude.complete`, `URL.createObjectURL`, `window.fetch`, or
`window.open`. Also shows the raw postMessage bridge traffic in the PostMessage Log tab.

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys to those starting with this prefix |
| `container` | `string` | auto-created `<div>` | CSS selector for an existing mount target |

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
  "prefix": "myapp:"
}
```

## Tab descriptions

### About
Default landing tab. Capability overview: what each tab does, usage snippet, and an explanation
of the inject-script.

### Storage (`window.storage`)

Calls `window.storage.list(prefix, false)` for private keys and
`window.storage.list(prefix, true)` for shared keys in parallel. Displays all key-value pairs,
allows clicking any key to view/edit its JSON value (auto-saved after 1 s), create new entries,
and delete individual keys.

In **draft mode** this tab is overlaid — `window.storage` is version-siloed and write-blocked
in the AI preview panel. The other tabs work normally in draft.

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

The inject-script replaces `window.fetch` with a postMessage bridge, but this bridge is scoped
to the Anthropic API only — it is not a general HTTP proxy. Only `api.anthropic.com` requests
are forwarded; all other origins are rejected at the network layer.

The tab ships pre-filled with working Anthropic API examples (simple completions, streaming,
web search tool) and two deliberately-blocked examples (httpbingo.org, api.github.com) that
show the failure mode. Form with URL, method, optional key-value headers, and a body textarea.

For external data from arbitrary origins: use the `web_search` tool via the Anthropic API, or
an MCP connector — both route through the parent frame rather than the iframe.

### External Navigation (`<a>` + `window.open`)

A curated list of `<a target="_blank">` links (MDN, Anthropic docs, GitHub, npm, Tailwind CSS)
to demonstrate link interception. Also includes a URL input + "Open in new tab" button that
calls `window.open(url)`. Both paths route through the inject-script to open in the parent frame,
working around the iframe sandbox restriction on navigation.

### Inject Script
Shows the full source of Claude's inject-script with JavaScript syntax highlighting. Includes
an explanation of what each section does.

> **Note:** Claude hides this script from the artifact's source tab inside the Claude UI. It is
> not user-visible code — it is infrastructure that Claude always injects before your artifact HTML.

### PostMessage Log
Captures all postMessage traffic between the iframe and the parent Claude frame in real time.
Messages accumulate regardless of which tab is active, so you can use other tabs and review
the full bridge protocol here afterwards.

- **↑ OUT** (blue) — messages sent to the parent (proxied by wrapping the high-level APIs)
- **↓ IN** (green) — messages received from the parent (captured in the event listener capture phase)

Each entry shows: direction badge, timestamp with milliseconds, message type, and full JSON
payload. Collapsed by default — click to expand and see the full payload plus ISO timestamp.
The inject-script's `realParent` is a closed-over reference, so outgoing messages are captured
by wrapping `window.fetch`, `window.storage.*`, `window.claude.complete`, and `window.open`
rather than by patching `window.parent.postMessage` (which is already captured by the script).

## Draft mode behavior

Only the **Storage tab** is blocked in draft mode. The overlay explains why and links to the
detail modal. The other seven tabs are fully functional in both draft and published mode. A
`DraftBadge` in the context menu header remains visible on all tabs as a reminder.

## What this artifact cannot do

- **Bulk delete storage keys** — only individual key deletion is supported
- **Fetch arbitrary external APIs** — `window.fetch` is scoped to `api.anthropic.com` only;
  use the `web_search` tool or MCP connectors for other origins
- **Work outside a Claude artifact** — all APIs are injected by the Claude iframe bridge and
  are not available in a plain browser tab

## Embed — the only thing needed

The artifact ships with a built-in loading and error UI. **Do not add any loading overlay,
spinner, or `#loader-status` div** — the bundle handles all of that itself.

The complete embed is a single script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-claude-capabilities-demo@0/dist/index.umd.js"></script>
```

That is the entire artifact. Nothing else is required.

## Config (optional)

A config block is only needed when you want to override defaults. If you have no overrides,
omit it entirely — the artifact runs fine without it.

```html
<!-- Only include this when you actually need to set a field -->
<script id="alistigo-config" type="application/json">
{
  "app": "@alistigo/artifact-claude-capabilities-demo",
  "prefix": "myapp:"
}
</script>
```

## Rules for AI-generated artifacts

- **One script tag. That's it.** No `<div>` wrappers, no loading divs, no `onload`/`onerror` handlers, no inline CSS for spinners.
- **Do not add a loading layer.** The bundle includes its own loading and error states. Adding one outside creates a double-loading flash.
- **Config is optional.** Only emit the `<script id="alistigo-config">` block when you need to pass `prefix` or another field. Omit it when there are no overrides.
