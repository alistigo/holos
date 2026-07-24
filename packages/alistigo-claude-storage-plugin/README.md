# @alistigo/claude-storage-plugin

[![npm version](https://img.shields.io/npm/v/@alistigo/claude-storage-plugin.svg?style=flat)](https://www.npmjs.com/package/@alistigo/claude-storage-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

`ClaudeArtifactListRepository` — `window.storage`-backed implementation of `AlistigoListStore` for use inside Claude artifact runtime only.

Use `isClaudeArtifactContext()` to detect the runtime before instantiating.

## Usage

```ts
import { ClaudeArtifactListRepository, isClaudeArtifactContext } from "@alistigo/claude-storage-plugin";

const repo = isClaudeArtifactContext()
  ? new ClaudeArtifactListRepository()
  : fallbackRepo;
```
