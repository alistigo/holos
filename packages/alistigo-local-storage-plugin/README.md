# @alistigo/local-storage-repository

[![npm version](https://img.shields.io/npm/v/@alistigo/local-storage-repository.svg?style=flat)](https://www.npmjs.com/package/@alistigo/local-storage-repository)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

`LocalStorageListRepository` — `localStorage`-backed implementation of `AlistigoListStore` for regular browser contexts.

## Usage

```ts
import { LocalStorageListRepository } from "@alistigo/local-storage-repository";

const repo = new LocalStorageListRepository();
```
