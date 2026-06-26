# @alistigo/artifact-config-list-format

JSON Schema and TypeScript types for the Alistigo list artifact config document.

## Install

```sh
pnpm add @alistigo/artifact-config-list-format
```

## Usage

```ts
import { validateListConfig, type ListArtifactConfig } from "@alistigo/artifact-config-list-format";

const config = validateListConfig({ readonly: true });
// => { readonly: true }
```
