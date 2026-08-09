# @alistigo/artifact-claude-capabilities-demo

A self-contained Claude artifact that exercises every API Claude injects into artifact iframes. Drop one `<script>` tag into any Claude HTML artifact and get an eight-tab interactive explorer.

## Why this exists

Every HTML artifact Claude generates runs inside a sandboxed iframe. Before it loads, Claude silently prepends a bridge script that patches the global environment: it installs `window.storage`, `window.claude`, `window.fetch`, `window.open`, and `URL.createObjectURL` as postMessage proxies to the parent Claude frame. This artifact makes all of those APIs tangible — each tab demonstrates one capability with live interaction so you can verify the bridge works, see exactly what data flows through, and understand the constraints (draft mode, same-origin links, etc.).

## Tabs

### About
Capability overview: what each tab does, usage snippet, and an explanation of the inject-script. The default landing tab.

### Storage — `window.storage`
A promise-based key-value store backed by the Claude conversation. Supports a private namespace (scoped to the artifact) and a shared namespace (available across all artifacts in the same conversation). The tab provides a full browser: list keys by prefix, inspect JSON values, create, edit with auto-save, and delete entries.

> **Draft mode:** `window.storage` is unavailable until the artifact is published. This tab is disabled in draft mode.

### AI — `window.claude.complete()`
Sends a prompt to the Claude model that generated the artifact and returns the completion as a string. The call routes through a postMessage bridge and resolves when Claude replies. No external API key needed.

### File Generation — `URL.createObjectURL` / `data:` URI
Two download paths side by side:

- **Blob path** — `URL.createObjectURL(blob)` produces a `blob-request://` URL. The inject-script intercepts the anchor click, reads the blob as an `ArrayBuffer`, and forwards it to the parent frame for download.
- **data: URI path** — encode content as `data:text/csv;base64,…` directly in the anchor `href`. The inject-script parses the MIME type and base64 payload inline — no blob or object URL needed.

Both paths work in draft mode.

### API Calls — `window.fetch`
The inject-script replaces `window.fetch` with a postMessage bridge, but this bridge is a **mediation layer scoped to the Anthropic API** — not a general HTTP client. Only requests to `api.anthropic.com` are forwarded by the parent frame; all other origins are rejected at the network layer regardless of what is listed in the Capabilities domain allowlist (which governs code execution, not artifact fetch).

The tab ships with pre-built examples for common Anthropic API patterns (simple completions, streaming, web search tool), plus two deliberately-blocked examples (httpbingo.org, api.github.com) that demonstrate the failure mode. For external data from arbitrary hosts, use the `web_search` tool via the Anthropic API or an MCP connector — both route through the parent rather than the iframe.

### PostMessage Log — bridge protocol inspector
Captures and displays every postMessage sent between the artifact iframe and the parent Claude frame in real time. Messages accumulate across all tab switches so you can use Storage, AI, API Calls, or any other tab and then review the full message traffic here. Each entry shows direction (↑ OUT / ↓ IN), timestamp with milliseconds, message type, and the full JSON payload — collapsed by default, click to expand.

### External Navigation — `window.open` / `<a>` links
External links (href pointing to a different hostname) and `window.open()` calls are intercepted by the inject-script and forwarded to the parent frame as `openExternal` postMessages. The parent decides whether to open them. Same-origin links pass through normally.

### Inject Script
Shows the full source of Claude's inject-script with JavaScript syntax highlighting. Includes an explanation of what each section does.

> **Note:** Claude hides this script from the artifact's source tab inside the Claude UI. It is not user-visible code — it is infrastructure that Claude always injects before your artifact HTML.

## Usage

Paste into a Claude HTML artifact:

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-claude-capabilities-demo@0/dist/index.umd.js"></script>
```

The artifact mounts itself to a full-height container it creates in `<body>`.

## Configuration

Pass a config block before the script tag to customise behaviour:

```html
<script id="alistigo-config" type="application/json">
  {
    "app": "@alistigo/artifact-claude-capabilities-demo",
    "prefix": "myapp:"
  }
</script>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-claude-capabilities-demo@0/dist/index.umd.js"></script>
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys to those starting with this prefix |
| `container` | `string` | auto-created `<div>` | CSS selector for an existing mount target |

## Draft mode

The Storage tab requires a published artifact (`window.storage` is unavailable until Claude assigns the artifact a stable identity). All other tabs — AI, File Generation, API Calls, External Navigation, Inject Script, PostMessage Log, and About — work immediately from a freshly pasted draft.

The artifact shows a **Draft** badge in the top-right corner when running unpublished. Clicking it explains why the Storage tab is disabled.

## How it works

The artifact is a UMD bundle built with Vite + React + Tailwind. It uses:

- `@alistigo/artifact-core` — lifecycle hooks (`useArtifactLifecycle`, `useStartArtifact`)
- `@alistigo/claude-storage-plugin` — typed wrapper around `window.storage`
- `@alistigo/artifact-core-components-react` — loading/error screens, context menu, modal

The inject-script source (`packages/claude-artifact-api/inject-script.html`) is inlined at build time via Vite's `?raw` import and displayed in the Inject Script tab.
