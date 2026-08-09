# @alistigo/artifact-claude-capabilities-demo — Skill

AI usage guide for the `@alistigo/artifact-claude-capabilities-demo` artifact.

## When to use

Render the capabilities demo inside a Claude HTML artifact whenever a developer asks to:

- See what's in `window.storage` or debug storage keys
- Try out `window.claude.complete()` (AI completions)
- Download a file generated inside an artifact
- Test `window.fetch` (Anthropic API bridge) from inside a Claude artifact
- Test external navigation (`window.open`, `<a target="_blank">`)
- Inspect the raw postMessage bridge traffic between the artifact and the parent
- Explore or demo all Claude artifact iframe APIs in one place

## Trigger phrases

- "demo claude artifact capabilities"
- "show all claude artifact APIs"
- "artifact capabilities demo"
- "explore storage"
- "show window.claude.complete"
- "call claude from an artifact"
- "download file from artifact"
- "artifact network demo"
- "test window.fetch in artifact"
- "artifact external links"
- "window.open in artifact"
- "postmessage log"
- "inspect postmessage"
- "artifact bridge traffic"

## What the artifact does

Renders an eight-tab UI covering every API Claude injects into artifact iframes:

| Tab | API / capability demonstrated |
|-----|-------------------------------|
| **About** | Capability overview, usage snippet, inject-script explanation |
| **Storage** | `window.storage` — list, create, edit, delete keys |
| **AI** | `window.claude.complete(prompt)` — live completions |
| **File Generation** | `URL.createObjectURL` → `blob-request://` download |
| **API Calls** | `window.fetch` — Anthropic API bridge (scoped to `api.anthropic.com`) |
| **External Navigation** | `<a target="_blank">` + `window.open()` |
| **Inject Script** | Full inject-script source with syntax highlighting |
| **PostMessage Log** | Real-time bridge protocol inspector — all OUT and IN messages |

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys by prefix |
| `container` | `string` | auto-created `<div>` | CSS selector for existing mount target |

## Minimal config

```json
{
  "app": "@alistigo/artifact-claude-capabilities-demo"
}
```

## Draft mode behavior

Only the **Storage tab** is blocked in draft mode. The other seven tabs work normally. A
`DraftBadge` in the context menu header stays visible on all tabs as a reminder.

## Limitations

- Only works inside a Claude artifact iframe (all APIs require the Claude bridge)
- `window.fetch` is scoped to `api.anthropic.com` only — not a general HTTP proxy
- Bulk storage operations are not supported (only individual key deletion)
