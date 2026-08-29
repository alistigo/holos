# @alistigo/list-document

[![npm version](https://img.shields.io/npm/v/@alistigo/list-document.svg?style=flat)](https://www.npmjs.com/package/@alistigo/list-document)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)

**Everything needed to work with an Alistigo list document** — schemas, types, serializer, projector, application service, and validation in a single package. The iframe app, runner, plugins, and UI components all import from here.

A list document is a JSON-LD object conforming to schema.org `ItemList`, extended with an append-only event log:

```jsonc
{
  "@context": { "@vocab": "https://schema.org/", "alistigo": "https://json-ld.alistigo.com/vocab/" },
  "@type": "ItemList",
  "@id": "lst_00000000000000000000000001",
  "identifier": "lst_00000000000000000000000001",
  "name": "Groceries",
  "itemListElement": [
    { "@type": "ListItem", "alistigo:listElementId": "lse_00000000000000000000000001", "position": 1, "name": "Milk" }
  ],
  "alistigo:eventLog": [
    {
      "@id": "lev_00000000000000000000000001",
      "alistigo:eventType": "ListCreated",
      "list": { "@id": "lst_00000000000000000000000001" },
      "agent": { "@id": "act_00000000000000000000000001" },
      "startTime": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## Install

```sh
pnpm add @alistigo/list-document @alistigo/list-domain @alistigo/logger
# Only needed if you call validateDocument():
pnpm add ajv ajv-formats
```

## What's exported

### Document types and schema

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
| `Reference` | JSON-LD node reference shape `{ "@id": string }` |
| `AlistigoActorRecord` | Actor identity record (re-exported from `@alistigo/core-document`) |
| `AlistigoPluginRecord` | Plugin registration record (re-exported from `@alistigo/core-document`) |
| `ALISTIGO_CONTEXT` | The JSON-LD `@context` constant (re-exported from `@alistigo/core-document`) |
| `documentSchema` | The raw JSON schema object |
| `validateDocument` | Validate an unknown value against the JSON schema |

### Projection and serialization

| Export | Purpose |
|--------|---------|
| `buildProjection` | Build a view-model projection from a document |
| `buildAttributionMap` | Build an actor attribution map |
| `ListDocumentSerializer` | Serialize/deserialize a list domain model to/from a document |

### Markdown helpers

| Export | Purpose |
|--------|---------|
| `buildListDocumentFromMarkdown` | Parse a Markdown checklist into a full document |
| `parseListMarkdown` | Parse title and items from markdown |
| `isValidListMarkdown` | Validate markdown without producing a document |

### Event projector

| Export | Purpose |
|--------|---------|
| `projectList` | Pure function — replays events → current `ListProjection` |
| `ListProjector` | Namespace object: `ListProjector.project(listId, events)` |
| `ListProjection` | Type returned by `projectList` |

### Application service

| Export | Purpose |
|--------|---------|
| `ListApplicationService` | Orchestrates commands through the `List` aggregate; persists via `AlistigoListStore` |
| `AlistigoListStore` | Repository interface (extends `ListRepository` with `loadDocument` / `saveDocument`) |
| `Result<T, E>` | Discriminated-union result type returned by service methods |
| `ok` | Construct a successful `Result` |
| `err` | Construct a failed `Result` |

The list JSON schema is also available as a subpath export:

```ts
import documentSchema from "@alistigo/list-document/schemas/document.json" with { type: "json" };
```

## Usage

### Types

```ts
import type { AlistigoDocument, AlistigoEventRecord } from "@alistigo/list-document";
import { ALISTIGO_CONTEXT } from "@alistigo/list-document";
```

### Validation

```ts
import { validateDocument } from "@alistigo/list-document";

const result = await validateDocument(unknownInput);
if (!result.valid) {
  console.error(result.errors);
}
```

### Projection

```ts
import { buildProjection } from "@alistigo/list-document";

const projection = buildProjection(document);
// projection.numberOfItems — element count
// projection.itemListElement — ordered items with optional attribution
```

### Application service

```ts
import { ListApplicationService, type AlistigoListStore } from "@alistigo/list-document";

// Implement AlistigoListStore for your storage backend:
class MyStore implements AlistigoListStore { /* ... */ }

const service = new ListApplicationService(new MyStore());

const result = await service.createList(actorId, "Groceries");
if (result.ok) {
  const doc: AlistigoDocument = result.value;
}
```

## Related

- [`@alistigo/core-document`](../document/) — base types this package extends
- [`@alistigo/list-domain`](../list-domain/) — domain model (pure business logic, no I/O)
