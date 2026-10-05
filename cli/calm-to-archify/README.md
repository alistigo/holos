# @alistigo/calm-to-archify

[![npm version](https://img.shields.io/npm/v/@alistigo/calm-to-archify.svg?style=flat)](https://www.npmjs.com/package/@alistigo/calm-to-archify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

CLI that converts [FINOS CALM](https://calm.finos.org/) architecture instances (`.arch.json`) into interactive HTML diagrams via [archify](https://github.com/tt-a1i/archify).

## Install

```sh
pnpm add -D @alistigo/calm-to-archify
# or globally
npm install -g @alistigo/calm-to-archify
```

Requires Node.js ≥ 18.

## Commands

### `build` (default)

Full pipeline: CALM JSON → archify JSON-IR → standalone HTML.

```sh
calm-to-archify systems/*.arch.json
calm-to-archify build systems/*.arch.json
```

Shell glob expansion passes all matched files as positional arguments. Each file produces two outputs next to the source: `<unique-id>.archify.json` and `<unique-id>.archify.html`.

**Options**

| Flag | Description |
|------|-------------|
| `--output-dir,-o <dir>` | Write outputs to `<dir>` instead of each file's own directory |

```sh
calm-to-archify systems/*.arch.json --output-dir .archify-out
```

### `transform`

CALM JSON → archify JSON-IR only (no HTML rendering).

```sh
calm-to-archify transform path/to/my.arch.json --output path/to/output.archify.json
```

**Options**

| Flag | Description |
|------|-------------|
| `--output,-o <path>` | Output path for the archify JSON file (required) |

## Input format

Accepts CALM architecture instances — files that contain `nodes` and `relationships` at the top level. Pattern files (`.pattern.json`) are JSON Schema documents and are not supported.
