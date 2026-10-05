# @alistigo/archify-render

[![npm version](https://img.shields.io/npm/v/@alistigo/archify-render.svg?style=flat)](https://www.npmjs.com/package/@alistigo/archify-render)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CI](https://github.com/alistigo/holos/actions/workflows/ci.yml/badge.svg)](https://github.com/alistigo/holos/actions/workflows/ci.yml)

Thin CLI wrapper around [archify](https://github.com/tt-a1i/archify) that renders an archify JSON-IR file into a standalone interactive HTML diagram.

## Install

```sh
npm install -g @alistigo/archify-render
# or
yarn global add @alistigo/archify-render
# or
pnpm add -g @alistigo/archify-render
```

As a dev dependency:

```sh
npm install -D @alistigo/archify-render
```

Requires Node.js ≥ 18. The `archify` renderer is bundled as a dependency and installed automatically.

## Usage

```sh
archify-render <input.archify.json>
archify-render render <input.archify.json>
```

The output path is read from the `meta.output` field inside the JSON file, so no `--output` flag is needed in the normal case.

**Options**

| Flag | Description |
|------|-------------|
| `--output,-o <path>` | Override the output HTML path |
| `--type,-t <type>` | Diagram type: `architecture` (default), `workflow`, `sequence`, `dataflow`, `lifecycle` |

### Examples

```sh
# Render using the output path baked into the JSON
archify-render .archify-out/typical-alistigo-artifact.archify.json

# Override output path
archify-render diagram.json --output my-diagram.html

# Render a workflow diagram
archify-render flow.json --type workflow
```

## Input format

Expects an archify JSON-IR file — the intermediate format produced by [`@alistigo/calm-to-archify transform`](../calm-to-archify). The `meta.output` field in the JSON determines where the HTML is written.

## About archify

[archify](https://github.com/tt-a1i/archify) is an open-source tool that turns a structured JSON description of a system into a fully interactive standalone HTML diagram — no server required, no external dependencies at runtime. `archify-render` is a thin CLI wrapper around it that handles path resolution and the archify JSON-IR format.

## Thanks

A big thank you to the [archify team](https://github.com/tt-a1i/archify) for building a lightweight, dependency-free renderer that turns plain JSON into beautiful interactive diagrams — great work.
