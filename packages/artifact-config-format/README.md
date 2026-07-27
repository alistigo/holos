# @alistigo/artifact-config-format

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-config-format.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-config-format)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

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
