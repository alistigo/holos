# @alistigo/artifact-ai-draw-comments-skill

Agent skill that teaches Claude when and how to embed the AI Draw Comments widget into artifacts.

## What It Does

This skill package contains `SKILL.md` — a prompt document that instructs Claude to:

- Recognise when a user wants to give visual feedback on a Claude artifact
- Embed the [`@alistigo/artifact-ai-draw-comments`](../artifact-ai-draw-comments) UMD widget via a single `<script>` tag
- Configure the widget for a specific container element (optional)
- Use the imperative `window.AiDrawComments` API for advanced programmatic control

## Usage

This package is consumed by the agent runtime (SpecKit / Claude Code skills layer). It does not export any JavaScript — only `SKILL.md` and this `README.md` are published.

To activate the skill in a Claude session, reference the `SKILL.md` document in the system prompt or through the skills registration mechanism.

## Widget Quick Reference

```html
<!-- Minimal: auto-mounts at the top of <body> -->
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

```html
<!-- With container -->
<script type="application/json" id="alistigo-config">
{ "drawComments": { "container": "#my-app" } }
</script>
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-ai-draw-comments@0/dist/index.umd.js"></script>
```

See [SKILL.md](./SKILL.md) for the complete user-flow description and API reference.

## Related Packages

| Package | Role |
|---------|------|
| [`@alistigo/artifact-ai-draw-comments`](https://www.npmjs.com/package/@alistigo/artifact-ai-draw-comments) | The embeddable widget (UMD bundle) |
