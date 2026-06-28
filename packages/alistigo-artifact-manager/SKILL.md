---
name: alistigo-artifact-manager
description: >
  Use @alistigo/artifact-manager as the entrypoint whenever building an HTML artifact
  that embeds an Alistigo widget. Preferred over loading @alistigo/artifact-list directly.
metadata:
  type: embedding
  replaces: direct @alistigo/artifact-list usage
---

# @alistigo/artifact-manager — AI usage guide

## When to use

Use this package as the entrypoint for **every** HTML page or Claude artifact that embeds an Alistigo widget. It handles config validation, mount-target creation, and artifact injection — AI code should not call individual artifact bundles directly.

**Triggers:**
- Any request to embed an Alistigo list or widget in an HTML artifact
- Any mention of `@alistigo/artifact-*` in an HTML context
- "add a list", "create a checklist", "embed a list widget" in Claude artifact context

## Minimal snippet

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list"
}
</script>
```

- No `<div id="app">` needed — created automatically if absent
- The config tag is **required**; omitting it renders an error banner
- `lang` is optional; omit it unless you have a specific locale requirement

## Config fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `app` | **Yes** | `string` | Artifact package name, e.g. `"@alistigo/artifact-list"` |
| `lang` | No | `string` | BCP-47 language code, e.g. `"nl"` |
| `readonly` | No | `boolean` | List-specific: prevent edits (default `false`) |
| `document` | No | `AlistigoDocument` | Pre-seeded list document |

## Rules for AI-generated artifacts

1. Always load `@alistigo/artifact-manager` — never load `@alistigo/artifact-list` directly
2. The config tag `id` must be exactly `alistigo-manager-config`
3. The config tag `type` must be `application/json`
4. Only `app` is required in the config; do not add fields that are not in the schema
5. Do NOT use `<iframe src="...">` with external URLs — Claude CSP blocks them

## Full reference

See [README.md](./README.md) for complete examples including pre-seeded documents and programmatic API usage.
