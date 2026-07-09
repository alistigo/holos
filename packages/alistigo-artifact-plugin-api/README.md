# @alistigo/artifact-plugin-api

Composable plugin interface, event bus, and CDN dynamic-import loader shared by every
`@alistigo` artifact. A plugin implements `AlistigoPlugin` and ships as its own
independently-versioned npm package; the host artifact loads it dynamically at runtime
via `await import()` against a jsDelivr URL — never bundled at build time.

## Install

```sh
pnpm add @alistigo/artifact-plugin-api
```

## Usage

Implementing a plugin:

```ts
import type { AlistigoPlugin } from "@alistigo/artifact-plugin-api";

const myPlugin: AlistigoPlugin = {
  name: "@alistigo/my-plugin",
  setup(ctx) {
    ctx.logger.info({}, "my-plugin initialized");
    ctx.on("error:uncaught", ({ error }) => {
      // react to a host-emitted event
    });
  },
};

export default myPlugin;
```

Hosting plugins from an artifact:

```ts
import { createPluginRuntime, loadPlugin } from "@alistigo/artifact-plugin-api";

const plugins = await Promise.all(
  Object.keys(config.plugins ?? {}).map((pkg) => loadPlugin(pkg)),
);
const runtime = createPluginRuntime(plugins, hostInfo, logger, config.plugins ?? {});
await runtime.setup();
```

See [docs/adrs/0016-artifact-plugin-system.md](../../docs/adrs/0016-artifact-plugin-system.md)
for the design rationale.
