# @alistigo/artifact-posthog-plugin

PostHog analytics plugin for `@alistigo` artifacts. Implements `AlistigoPlugin` from
`@alistigo/artifact-plugin-api` — a pure `setup()` + event-subscriber. Replaces the
PostHog wiring that used to be hardcoded inside `@alistigo/artifact-list`.

## Install

```sh
pnpm add @alistigo/artifact-posthog-plugin
```

## Usage

Enable it in an artifact's config:

```json
{
  "app": "@alistigo/artifact-list",
  "plugins": {
    "@alistigo/artifact-posthog-plugin": {}
  }
}
```

The plugin's own API key is baked into its bundle at publish time via
`VITE_POSTHOG_KEY` — it never reads secrets from
`config.plugins["@alistigo/artifact-posthog-plugin"]`.

See [docs/adrs/0016-artifact-plugin-system.md](../../docs/adrs/0016-artifact-plugin-system.md)
for the design rationale.
