---
status: accepted
date: 2026-08-29
deciders: Mikael Labrut
---

# ADR 0026 — Alistigo Document Format: JSON-LD + schema.org Foundation and Package Standard

**Status:** Accepted
**Date:** 2026-08-29

## Context

An Alistigo **document** is the data layer of an artifact — the equivalent of a `.doc` or `.xlsx` file. Every artifact reads and edits exactly one document. The base document shape is defined in `@alistigo/document` and each artifact type defines a specialization (e.g. the list document in `@alistigo/list`).

Until now, no formal standard existed for:
- How documents are structured and which vocabulary they use
- How entities reference each other within a document
- How document packages are named and what they must contain
- Where event-replay logic (the CQRS projector) lives
- How AI-seeded documents via markdown fit into the package contract

This ADR establishes those standards.

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Documents must be self-describing — no external schema lookup required to interpret them | P1 |
| R2 | Documents must use a stable, widely-recognised vocabulary to maximise interoperability and AI readability | P1 |
| R3 | Cross-entity references must be unambiguous and consistent | P1 |
| R4 | Package names must communicate their role without reading their contents | P2 |
| R5 | Every document package ships with everything needed to validate, type, and replay its documents | P2 |
| R6 | Packages that support AI input must provide a canonical markdown parser and examples | P2 |

## Decision

### 1. JSON-LD as the document wire format

All Alistigo documents are valid [JSON-LD](https://json-ld.org/) documents. They carry a `@context` object, a `@type`, and a `@id`. The JSON-LD keywords (`@context`, `@type`, `@id`, `@vocab`) are the primary structural mechanism — not custom envelope fields.

### 2. schema.org as the default vocabulary

The `@context` always sets:

```json
{
  "@vocab": "https://schema.org/",
  "alistigo": "https://json-ld.alistigo.com/vocab/"
}
```

Properties and entity types default to the schema.org namespace. Alistigo-specific terms that have no schema.org equivalent use the `alistigo:` prefix. **When a new property or entity is needed, check schema.org first** — only introduce an `alistigo:` term when nothing equivalent exists.

### 3. `@id` for identifiers; JSON-LD node references for cross-entity links

Entities carry their identifier in `@id`. References from one entity to another use a JSON-LD node reference object `{ "@id": "..." }` — never a flat string ID property named after the target entity.

```jsonc
// ❌ old pattern — do not use
{ "listId": "lst_..." }

// ✅ new pattern — JSON-LD reference
{ "list": { "@id": "lst_..." } }
```

`alistigo:listId` properties in existing schemas are deprecated and will be replaced in a follow-up migration.

### 4. Package naming convention

All document packages follow the naming scheme `@alistigo/<type>-document`.

Current packages to rename (tracked as follow-up work):

| Current name | New name |
|---|---|
| `@alistigo/document` | `@alistigo/core-document` |
| `@alistigo/list` | `@alistigo/list-document` |

### 5. Document package contract

Every `@alistigo/*-document` package must provide:

| Deliverable | Details |
|---|---|
| **JSON Schema** | `src/schemas/<type>.json`; use `schema-org-json-schemas` to reference schema.org definitions rather than rewriting them |
| **TypeScript types** | Extend `schema-dts`; exported from the package index |
| **Examples** | `examples/simple.json` at minimum; validated by CI |
| **README** | Context, usage, and the minimal example inline |
| **Package type marker** | `"alistigo": { "type": "document" }` in `package.json` |
| **Test target** | `project.json` `test` target runs every example through the JSON Schema validator |
| **Event projector** | See decision 6 |
| **Markdown parser** (if applicable) | See decision 7 |

Biome formats and lints JSON files in this repo — no separate formatter needed.

### 6. Event projectors live in the document package

All Alistigo documents are event-sourced: the `alistigo:eventLog` array is the source of truth, and replaying it deterministically recreates the current document state. The projector function (the pure reducer that does this replay) belongs in the document package, not in a separate editor package.

- `@alistigo/list-document-editor`'s `list-projector.ts` (`projectList`) moves into `@alistigo/list-document`, exported at the package root
- `@alistigo/list-document-editor` retains the **application / command layer** only (accepts user commands → produces events → calls the projector from `@alistigo/list-document`)
- All future document packages ship their projector from day one

### 7. Markdown input: canonical parser in the document package

Some documents can be seeded from a simplified markdown format written by AI (established in ADR 0021). For these document types, the document package must export:

- `parseMarkdown(source: string): Document` — converts markdown to a valid document
- `validateMarkdown(source: string): ValidationResult` — validates the markdown grammar without producing a full document

The canonical format for the list document (from ADR 0021):

```
List title:
- First element
- Second element
Key: value metadata attached to the preceding element
1. Ordered element
```

Currently, `parseMarkdownToDocument` and `validateAsListDocument` live in `@alistigo/artifact-list`. They will move into `@alistigo/list-document` as part of the package-contract migration.

`examples/` must include at least one `.md` fixture demonstrating the supported grammar.

The `cli/document-validator` exposes a `validate-markdown <file> --schema <type>` command that uses the parser exported by the target document package, in addition to the existing JSON document validation path.

### Future (out of scope)

JSON schemas, examples, and the JSON-LD context will be published at `https://json-ld.alistigo.com`:

- `https://json-ld.alistigo.com/json-schemas/list.schema.json`
- `https://json-ld.alistigo.com/examples/list/simple.json`
- `https://json-ld.alistigo.com/vocab/`

A separate ADR will be written when publishing is ready.

## Rationale

### JSON-LD vs plain JSON

| Criterion | Plain JSON | **JSON-LD (chosen)** |
|---|---|---|
| Self-describing | No — requires out-of-band schema | Yes — `@context` embeds vocabulary |
| AI readability | Low — property names are opaque | High — schema.org terms are in AI training data |
| Graph tooling | None | Full JSON-LD / RDF toolchain |
| Runtime cost | None | None — `@context` is metadata only |

### schema.org vs custom vocabulary

schema.org covers the vast majority of properties needed for list documents (`ItemList`, `ListItem`, `name`, `position`, `startTime`, `agent`, …). Using it avoids reinventing semantics, makes documents interpretable by external tools without documentation, and aligns with AI training data. Custom `alistigo:` terms are additive, not competing.

### `@id` + node reference vs flat ID string

| Criterion | `entityId: "..."` | **`entity: { "@id": "..." }` (chosen)** |
|---|---|---|
| JSON-LD validity | No — requires custom mapping | Yes — native node reference |
| Graph tools | Requires mapping | Works out-of-the-box |
| Semantic clarity | Implicit | Explicit — the link target is typed |

### Projector in document package vs separate package

The projector is a pure function of the document schema: it knows event types, their shapes, and how they mutate document state. Keeping it in a separate package creates a split between "what the document looks like" and "how to reconstruct it from events" — a split with no benefit and significant friction when schemas evolve. Co-locating them means a single import provides everything needed to work with a document.

## Consequences

**Positive:**
- Documents are self-describing, interoperable, and AI-friendly out of the box
- Uniform package contract — every `*-document` package delivers the same set of artifacts
- Projectors travel with schemas — no version skew between format and replay logic
- Markdown examples and parsers are co-located with the JSON-LD schema in a single package

**Negative / tradeoffs accepted:**
- Renaming `@alistigo/document` → `@alistigo/core-document` and `@alistigo/list` → `@alistigo/list-document` is a breaking change affecting ~8 packages; migration is tracked as follow-up work
- Moving `projectList` out of `@alistigo/list-document-editor` is a breaking change for that package's public API; consumers must update their import path
- Moving `parseMarkdownToDocument` and `validateAsListDocument` out of `@alistigo/artifact-list` is a breaking change for that package; migration is tracked alongside the rename
- The `alistigo:listId` flat-string reference in the current list schema is deprecated but not yet removed — it will persist until the schema migration is applied

## Alternatives considered

- **Plain JSON with a custom schema** — rejected: no semantic layer; reinvents vocabulary that schema.org already provides at no cost
- **`entityNameId` flat string pattern** — rejected: loses explicit link semantics; incompatible with JSON-LD node references; makes graph tooling require custom mapping
- **Keep projector in a separate `*-document-editor` package** — rejected: creates coupling between schema and replay logic that breaks silently when the schema evolves
- **Keep markdown parser in the artifact package** — rejected: the markdown format is part of the document contract, not the artifact implementation

## References

- ADR 0016 — Composable Artifact Plugin System
- ADR 0021 — AI Input Action: Markdown as Document Source Format (markdown grammar, boot flow; current location of `parseMarkdownToDocument` / `validateAsListDocument`)
- ADR 0023 — Entity IDs: TypeID as the Preferred Format (format of `@id` values)
- ADR 0024 — Shared-List View: Actor Registry in Document
- [schema.org](https://schema.org), [JSON-LD spec](https://www.w3.org/TR/json-ld11/)
- npm: [schema-dts](https://www.npmjs.com/package/schema-dts), [schema-org-json-schemas](https://www.npmjs.com/package/schema-org-json-schemas)
