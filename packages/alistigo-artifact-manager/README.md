# @alistigo/artifact-manager

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-manager.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

The entrypoint to use Alistigo applications in an artifact.
<br>Include the **manager** then give a manager configuration with what application you want + its plugins, options and a document.

---

## Minimal usage

```html
<script src="https://cdn.jsdelivr.net/npm/@alistigo/artifact-manager@0/dist/index.umd.js"></script>
<script id="alistigo-manager-config" type="application/json">
{
  "app": "@alistigo/artifact-list"
}
</script>
```

That's it. <br>In this example the manager will load the **list** application with its default configuration.

---

## Config reference

The `#alistigo-manager-config` script tag must contain valid JSON matching the `@alistigo/artifact-config-format` schema.

Only the field **app** is required.

See [@alistigo/artifact-config-format](../alistigo-artifact-config-format/README.md) for more details.

---

## Programmatic API

For environments where you control initialization yourself (e.g. a framework or custom boot sequence), import the package as an ES module:

```ts
import init from "@alistigo/artifact-manager/init";

init('#selector', {
  app: "@alistigo/artifact-list"
});
```

The first argument is a target where to insert the application. The second argument is the `artifact-config`.

---

## How it works

1. The UMD bundle loads and runs immediately (or on `DOMContentLoaded` if the script is in `<head>`)
2. It reads and parses the JSON in `<script id="alistigo-manager-config" type="application/json">`
3. Config is validated against `@alistigo/artifact-config-format` — a `TypeError` is thrown on invalid input
4. If no `<div id="app">` exists, one is appended to `<body>`
5. The artifact's UMD bundle is injected as a `<script>` tag into `<head>` and runs, auto-mounting into `#app`

---

## Error handling

If the config tag is missing or contains invalid JSON or an invalid config shape, the manager renders a red error banner at the top of `<body>` rather than silently failing:

```
@alistigo/artifact-manager: Missing required <script id="alistigo-manager-config" ...> tag.
```
