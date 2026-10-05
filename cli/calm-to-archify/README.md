# @alistigo/calm-to-archify

[![npm version](https://img.shields.io/npm/v/@alistigo/calm-to-archify.svg?style=flat)](https://www.npmjs.com/package/@alistigo/calm-to-archify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

CLI that converts [FINOS CALM](https://calm.finos.org/) architecture instances (`.arch.json`) into interactive HTML diagrams via [archify](https://github.com/tt-a1i/archify).

## Install

```sh
npm install -g @alistigo/calm-to-archify
# or
yarn global add @alistigo/calm-to-archify
# or
pnpm add -g @alistigo/calm-to-archify
```

As a dev dependency:

```sh
npm install -D @alistigo/calm-to-archify
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

## About CALM

[CALM (Common Architecture Language Model)](https://calm.finos.org/) is an open standard from [FINOS](https://www.finos.org/) for describing software architectures as machine-readable JSON. It lets you capture nodes (services, datastores, people) and the relationships between them in a way that can be validated, queried, and visualised automatically.

## About archify

[archify](https://github.com/tt-a1i/archify) is an open-source tool that turns a structured JSON description of a system into a fully interactive standalone HTML diagram — no server required, no external dependencies at runtime. `calm-to-archify` uses archify under the hood to produce the HTML output.

## Thanks

A big thank you to the [FINOS CALM team](https://github.com/finos/architecture-as-code) for building and maintaining an open, vendor-neutral standard for architecture-as-code — making tooling like this possible.

And to the [archify team](https://github.com/tt-a1i/archify) for creating a lightweight, dependency-free renderer that turns plain JSON into beautiful interactive diagrams — great work.
