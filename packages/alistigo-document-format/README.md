# @alistigo/document-format

The **specification, JSON schemas, and TypeScript types** for the Alistigo list document format. Single source of truth — every other Alistigo package (the iframe app, the runner, the host protocol, plugins) imports types and schemas from here.

A document is a self-contained JSON-LD object with three sections:

- **`meta`** — identity (listId, formatVersion, dates) and the *event-log integrity descriptor* (full / truncated / absent).
- **`eventLog`** — the append-only history. Optional. Can be prefix-truncated or omitted to shrink the document.
- **`projection`** — the current rendered state of the list (a schema.org `ItemList`).

```jsonc
{
  "@context": ["https://schema.org", { "alistigo": "https://alistigo.io/ns/v1#" }],
  "@type": "alistigo:Document",
  "meta": {
    "listId": "urn:uuid:0190f5cc-…",
    "formatVersion": "1.0.0",
    "dateCreated": "2026-04-30T12:00:00Z",
    "dateModified": "2026-04-30T12:00:00Z",
    "eventLog": { "presence": "full" }
  },
  "eventLog": [ /* append-only events */ ],
  "projection": {
    "@type": "ItemList",
    "itemListElement": [ /* current items */ ]
  }
}
```

## Documentation

| File | Purpose |
|------|---------|
| [`docs/spec.md`](docs/spec.md) | The full format specification: every section, every field, every rule. **Authoritative.** |
| [`docs/validation.md`](docs/validation.md) | How to validate a document — three layers (schema / plugin schemas / replay equivalence) with executable pseudo-code. |
| [`src/schemas/document.json`](src/schemas/document.json) | The JSON Schema (Draft 2020-12). Bundled — `$defs` cover Meta, Event, Projection, ListItem, Item. |
| [`src/types.ts`](src/types.ts) | TypeScript mirrors of the schemas. Keep in lockstep with the JSON. |

## Install

```sh
pnpm add @alistigo/document-format
# Optional — only if you use validateDocument():
pnpm add ajv ajv-formats
```

`ajv` and `ajv-formats` are *optional* peer dependencies. Consumers that only need types or the schema as JSON can skip them; consumers that call `validateDocument()` install them.

## Usage

### Types

```ts
import type {
  AlistigoDocument,
  AlistigoMeta,
  AlistigoEvent,
  AlistigoProjection,
} from "@alistigo/document-format";

const doc: AlistigoDocument = JSON.parse(rawJson);
```

### JSON Schema

```ts
import { documentSchema } from "@alistigo/document-format";

// or, if you want to point Ajv at the file directly (for npm CDN consumers etc):
//   import documentSchema from "@alistigo/document-format/schemas/document.json";
```

### Validation

```ts
import { validateDocument } from "@alistigo/document-format";

const result = await validateDocument(unknownInput);
if (!result.valid) {
  console.error(result.errors);
  return;
}
// proceed with input as AlistigoDocument
```

For full three-layer validation (schema + plugin schemas + replay equivalence), see [`docs/validation.md`](docs/validation.md).

### Replay an event log

```ts
import { replayEvents } from "@alistigo/document-format";

const projection = replayEvents(doc.eventLog ?? []);
// projection should equal doc.projection when meta.eventLog.presence is "full"
```

## How this package is meant to evolve

- The **spec** ([`docs/spec.md`](docs/spec.md)) and the **JSON schema** ([`src/schemas/document.json`](src/schemas/document.json)) are kept in lockstep. Don't edit one without the other.
- The **TypeScript types** ([`src/types.ts`](src/types.ts)) mirror the schema. They're a developer affordance, not the source of truth.
- Format versioning is **SemVer** — see [spec §6](docs/spec.md#6-versioning--evolution). Every change to the schema bumps `FORMAT_VERSION` (exported as a constant) and adds a row to the changelog.
- The package is **publishable** (`@mlabrut/*`) so the schema is fetchable by external systems via `unpkg`/`jsdelivr` etc. URL-stable schemas are part of the contract.

## Related

- [`projects/alistigo-ai/architecture.md`](../../projects/alistigo-ai/architecture.md) — why event sourcing and CQRS, and how the document interacts with the runtime.
- [`packages/alistigo-features/`](../alistigo-features/) — the Gherkin behavior specs that exercise this format.
