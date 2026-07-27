# @alistigo/artifact-config-list-format

[![npm version](https://img.shields.io/npm/v/@alistigo/artifact-config-list-format.svg?style=flat)](https://www.npmjs.com/package/@alistigo/artifact-config-list-format)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

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
