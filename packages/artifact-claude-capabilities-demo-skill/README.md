# @alistigo/artifact-claude-capabilities-demo — Skill

AI usage guide for the `@alistigo/artifact-claude-capabilities-demo` artifact.

## When to use

Render the capabilities demo inside a Claude HTML artifact whenever a developer asks to:

- See what's in `window.storage` or debug storage keys
- Try out `window.claude.complete()` (AI completions)
- Download a file generated inside an artifact
- Test `window.fetch` (network proxy) from inside a Claude artifact
- Test external navigation (`window.open`, `<a target="_blank">`)
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

## What the artifact does

Renders a five-tab UI covering every API Claude injects into artifact iframes:

| Tab | API demonstrated |
|-----|-----------------|
| **Storage** | `window.storage` — list, create, edit, delete keys |
| **AI** | `window.claude.complete(prompt)` — live completions |
| **File Generation** | `URL.createObjectURL` → `blob-request://` download |
| **API Calls** | `window.fetch` — proxied network requests |
| **External Navigation** | `<a target="_blank">` + `window.open()` |

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `prefix` | `string` | `""` | Filter Storage tab keys by prefix |
| `defaultTab` | `string` | `"storage"` | Which tab opens first |

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

## Draft mode behavior

Only the **Storage tab** is blocked in draft mode. The other four tabs work normally. A
`DraftBadge` in the context menu header stays visible on all tabs as a reminder.

## Limitations

- Only works inside a Claude artifact iframe (all five APIs require the Claude bridge)
- Bulk storage operations are not supported (only individual key deletion)
