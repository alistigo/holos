# @alistigo/artifact-config-format

Aggregate config schema and TypeScript types for `@alistigo` artifacts. Combines the base config (`app`, `lang`) with per-artifact schemas via a discriminated union on `app`.

## Install

```sh
pnpm add @alistigo/artifact-config-format
```

## Usage

```ts
import { validateArtifactConfig } from "@alistigo/artifact-config-format";

const config = validateArtifactConfig({ app: "@alistigo/artifact-list", lang: "en" });
```
