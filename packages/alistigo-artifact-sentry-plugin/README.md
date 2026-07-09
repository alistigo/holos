# @alistigo/artifact-sentry-plugin

Sentry error-monitoring plugin for `@alistigo` artifacts. Implements `AlistigoPlugin`
from `@alistigo/artifact-plugin-api` — a pure `setup()` + event-subscriber with no
React dependency. Replaces the Sentry wiring that used to be hardcoded inside
`@alistigo/artifact-list`.

## Install

```sh
pnpm add @alistigo/artifact-sentry-plugin
```

## Usage

Enable it in an artifact's config:

```json
{
  "app": "@alistigo/artifact-list",
  "plugins": {
    "@alistigo/artifact-sentry-plugin": {}
  }
}
```

The plugin's own DSN is baked into its bundle at publish time via `VITE_SENTRY_DSN` —
it never reads secrets from `config.plugins["@alistigo/artifact-sentry-plugin"]`.

See [docs/adrs/0016-artifact-plugin-system.md](../../docs/adrs/0016-artifact-plugin-system.md)
for the design rationale.
