# @alistigo/list

[![npm version](https://img.shields.io/npm/v/@alistigo/list.svg?style=flat)](https://www.npmjs.com/package/@alistigo/list)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)

**Specification, JSON schemas, and TypeScript types** for the Alistigo list document format. Single source of truth for what a list document looks like — the iframe app, runner, plugins, and editor all import from here.

A list document is a JSON-LD object conforming to schema.org `ItemList`, extended with an append-only event log:

```jsonc
{
  "@context": { "@vocab": "https://schema.org/", "alistigo": "https://alistigo.ai/vocab/" },
  "@type": "ItemList",
  "identifier": "lst_01234567890123456789012345",
  "name": "Groceries",
  "itemListElement": [
    { "@type": "ListItem", "alistigo:listElementId": "lse_…", "position": 1, "name": "Milk" }
  ],
  "alistigo:eventLog": [
    {
      "alistigo:eventId": "lev_…",
      "alistigo:eventType": "ListCreated",
      "alistigo:listId": "lst_…",
      "alistigo:actorId": "act_…",
      "alistigo:timestamp": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## Install

```sh
pnpm add @alistigo/list
# Only needed if you call validateDocument():
pnpm add ajv ajv-formats
```

## What's exported

| Export | Purpose |
|--------|---------|
| `AlistigoDocument` | Root document type (extends schema.org `ItemListLeaf`) |
| `AlistigoListItem` | List element type (extends schema.org `ListItemLeaf`) |
| `AlistigoEventRecord` | Union of all event record types |
| `AlistigoListCreatedRecord` | `ListCreated` event |
| `AlistigoListElementAddedRecord` | `ListElementAdded` event |
| `AlistigoListElementDeletedRecord` | `ListElementDeleted` event |
| `AlistigoListElementCheckedRecord` | `ListElementChecked` event |
| `AlistigoListExportedRecord` | `ListExported` event |
| `AlistigoActorRecord` | Actor identity record (re-exported from `@alistigo/core-document`) |
| `AlistigoPluginRecord` | Plugin registration record (re-exported from `@alistigo/core-document`) |
| `ALISTIGO_CONTEXT` | The JSON-LD `@context` constant (re-exported from `@alistigo/core-document`) |
| `buildProjection` | Build a projection map from a document |
| `buildAttributionMap` | Build an actor attribution map |
| `ListDocumentSerializer` | Serialize/deserialize a list domain model to/from a document |
| `buildListDocumentFromMarkdown` | Parse a Markdown checklist into a document |
| `validateDocument` | Validate an unknown value against the JSON schema |
| `documentSchema` | The raw JSON schema object |

The list JSON schema is also available as a subpath export:

```ts
import documentSchema from "@alistigo/list/schemas/document.json" with { type: "json" };
```

## Usage

### Types

```ts
import type { AlistigoDocument, AlistigoEventRecord } from "@alistigo/list";
import { ALISTIGO_CONTEXT } from "@alistigo/list";
```

### Validation

```ts
import { validateDocument } from "@alistigo/list";

const result = await validateDocument(unknownInput);
if (!result.valid) {
  console.error(result.errors);
}
```

### Projection

```ts
import { buildProjection } from "@alistigo/list";

const projection = buildProjection(document);
// projection.items — current ordered list items
// projection.checkedIds — Set of checked element IDs (if checkbox plugin active)
```

## Related

- [`@alistigo/core-document`](../document/) — base types this package extends
- [`@alistigo/list-domain`](../list-domain/) — domain model (pure business logic, no I/O)
- [`@alistigo/list-document-editor`](../list-document-editor/) — application service layer
