# Claude Artifact Capabilities & Constraints

> Last updated from live CSP inspection of `www.claudeusercontent.com` iframe.

> See also: [claude-chat-visuals.md](./claude-chat-visuals.md) — Claude's non-Artifact inline visual output and why Alistigo uses Artifacts instead.

---

## JavaScript Libraries (React Artifacts)

Available via pre-bundled imports (no CDN fetch needed):

| Library | Version | Use case |
|---|---|---|
| `react`, `react-dom` | — | Hooks: `useState`, `useEffect`, etc. |
| `recharts` | — | Charting |
| `lucide-react` | 0.383.0 | Icons |
| `mathjs` | — | Math expressions |
| `lodash` | — | Utilities |
| `d3` | — | Data visualization |
| `plotly` | — | Interactive charts |
| `three` | r128 | 3D (⚠️ no `OrbitControls`, no `CapsuleGeometry`) |
| `papaparse` | — | CSV parsing |
| `xlsx` (SheetJS) | — | Excel files |
| `chart.js` | — | Charts |
| `tone` | — | Audio / music |
| `mammoth` | — | `.docx` reading |
| `tensorflow` | — | ML |
| `shadcn/ui` | — | UI components via `@/components/ui/...` |

---

## External CDN Sources (HTML Artifacts)

Confirmed via iframe CSP (`script-src`). All of the following are explicitly allowed:

| CDN | URL | Notes |
|---|---|---|
| cdnjs | `https://cdnjs.cloudflare.com` | Classic JS/CSS libs |
| jsDelivr npm | `https://cdn.jsdelivr.net/npm/` | ✅ Any npm package |
| jsDelivr GitHub | `https://cdn.jsdelivr.net/gh/python-visualization/` | Folium, etc. |
| Pyodide | `https://cdn.jsdelivr.net/pyodide/` | Python in browser |
| Tailwind CDN | `https://cdn.tailwindcss.com` | ✅ Full JIT version |
| jQuery CDN | `https://code.jquery.com` | jQuery official CDN |

Usage in HTML artifacts:
```html
<!-- Any npm package via jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/some-package@version/dist/file.min.js"></script>

<!-- Tailwind with JIT (dynamic classes work!) -->
<script src="https://cdn.tailwindcss.com"></script>
```

> ✅ **Tailwind JIT works** in HTML artifacts via `cdn.tailwindcss.com` — dynamic class names like `text-${color}-500` are supported there, unlike in React artifacts.

---

## Tailwind CSS (React Artifacts)

In React artifacts, only **core utility classes** from the pre-defined base stylesheet are supported. No JIT compiler — dynamically constructed class names won't work. Use HTML artifacts + `cdn.tailwindcss.com` if you need full JIT.

---

## `connect-src` — fetch() / XHR Targets

Only these origins can be reached from artifact JS:

```
https://cdnjs.cloudflare.com
https://cdn.jsdelivr.net/pyodide/
https://cdn.jsdelivr.net/gh/python-visualization/
https://cdn.jsdelivr.net/npm/
https://cdn.tailwindcss.com
https://code.jquery.com
https://www.claudeusercontent.com
```

⚠️ **Arbitrary `fetch()` to external APIs is blocked.** For example, `fetch('https://api.github.com/...')` will fail. Only the origins above are reachable.

---

## Anthropic API (Claude-in-Claude)

Despite `api.anthropic.com` not appearing in `connect-src`, the Claude API works from artifacts — calls are **proxied through `claudeusercontent.com`**, not made directly. No API key needed; auth is injected server-side.

```js
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: "Your prompt here" }]
  })
});
```

---

## Storage API (`window.storage`)

A **persistent key-value storage API** is available across sessions:

```js
await window.storage.get(key, shared?)        // → {key, value, shared} | throws
await window.storage.set(key, value, shared?) // → {key, value, shared} | null
await window.storage.delete(key, shared?)     // → {key, deleted, shared} | null
await window.storage.list(prefix?, shared?)   // → {keys, prefix?, shared} | null
```

### Key constraints

- Keys < 200 chars, no whitespace, no `/`, `\`, `'`, `"`
- Values < 5 MB per key, text/JSON only (no binary)
- `shared: false` (default) → per-user storage
- `shared: true` → visible to all users of the artifact
- Rate limited — batch related data into single keys
- Last-write-wins on concurrent writes
- Non-existent key access **throws** (does not return null) — always use `try/catch`

> ⚠️ `localStorage` and `sessionStorage` are **NOT supported** and will fail.

---

## Using Your Own `.html` Files

Uploading a `.html` file as a live artifact directly is **not supported**. However:

- You can paste HTML content and Claude will create an artifact from it
- Uploaded `.html` files are readable and can be reproduced or modified as a new artifact
- The artifact renders in an iframe at `www.claudeusercontent.com` with the CSP above

---

## iframe Security (Confirmed via CSP Inspection)

### Allowed
- `'unsafe-eval'` — `eval()` works
- `'unsafe-inline'` — inline `<script>` and `<style>` tags work
- `blob:` workers — Web Workers via blob URLs
- WebAssembly (`'wasm-unsafe-eval'` on parent; Pyodide runs in iframe)
- Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
- OpenStreetMap tiles (`*.tile.openstreetmap.org`) for maps

### Blocked
- `webrtc 'block'` — no peer-to-peer connections
- `object-src 'none'` — no Flash/plugins
- `frame-src 'self' blob:` — no external iframes inside artifacts (no YouTube embed, etc.)
- `frame-ancestors` — artifact can only be embedded by claude.ai / anthropic.com domains
- External images (only OSM tiles, `data:`, `blob:`, and `claudeusercontent.com`)
- `localStorage` / `sessionStorage` — blocked (sandbox attribute, not CSP)

### CSP Violation Reporting
All violations are reported to **Datadog US5**:
```
https://logs.browser-intake-us5-datadoghq.com/api/v2/logs?dd-api-key=pub718...
```

---

## Summary

| Feature | Status |
|---|---|
| npm libs (React, pre-bundled) | ✅ Fixed set (see table above) |
| Any npm package in HTML artifacts | ✅ Via `cdn.jsdelivr.net/npm/` |
| cdnjs in HTML artifacts | ✅ Confirmed |
| Tailwind JIT (HTML artifacts) | ✅ Via `cdn.tailwindcss.com` |
| Tailwind JIT (React artifacts) | ❌ Pre-defined classes only |
| `window.storage` | ✅ Persistent, key-value, cross-session |
| `localStorage` / `sessionStorage` | ❌ Not supported |
| Own `.html` files | ⚠️ Via paste/copy, not direct mount |
| Anthropic API (no key needed) | ✅ Proxied via claudeusercontent.com |
| Arbitrary `fetch` to external APIs | ❌ Blocked by connect-src |
| External images via URL | ❌ Blocked (data: and blob: only) |
| Maps (OpenStreetMap tiles) | ✅ Explicitly allowed |
| WebRTC | ❌ Explicitly blocked |
| Nested iframes in artifacts | ❌ Only self + blob: |
| eval() / inline scripts | ✅ Both allowed |
