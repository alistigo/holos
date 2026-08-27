# @alistigo/document

[![npm version](https://img.shields.io/npm/v/@alistigo/document.svg?style=flat)](https://www.npmjs.com/package/@alistigo/document)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)

Base types and JSON schema shared by all Alistigo artifact documents. This is the foundation that artifact-specific packages (e.g. `@alistigo/list`) build on top of.

## What's in this package

- JSON schema of `alistigo:document`
- Typescript types of `AlistigoDocument`

## Usage

### JSON Schema

The base JSON schema is available as a subpath export for tooling (AJV, `$RefParser`, etc.):

```ts
import alistigoDocumentSchema from "@alistigo/document/schemas/alistigo-document.json" with { type: "json" };
```

### Typescript types

```ts
import {
  ALISTIGO_CONTEXT,
  type AlistigoActorRecord,
  type AlistigoPluginRecord,
  type TypeIDString,
} from "@alistigo/document";
```

## Related

- [`@alistigo/list`](../list/) — list document format built on top of this package
