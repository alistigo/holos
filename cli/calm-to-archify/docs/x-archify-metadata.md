# `x-archify` CALM metadata

`x-archify` is a vendor-prefixed extension entry placed in the `metadata` array of a CALM architecture document. It maps custom CALM node-types to archify rendering hints, giving you control over the icon color and legend label for each node-type in the generated diagram — without modifying the CLI.

## Why this exists

CALM's built-in node-types (`service`, `database`, `actor`, …) map naturally to archify component types. But if your CALM extension defines custom node-types (e.g. `module`, `plugin`, `skill`) the CLI has no way to know how to render them. Rather than hardcoding project-specific mappings in the CLI, each CALM document carries its own rendering hints directly.

## Structure

Add an entry to your document's `metadata` array:

```json
{
  "metadata": [
    {
      "x-archify": {
        "node-types": {
          "<node-type-id>": {
            "component-type": "<archify-type>",
            "legend-label": "<optional label>"
          }
        }
      }
    }
  ]
}
```

### `node-types`

A map from your custom CALM node-type identifiers to rendering hints. Standard CALM built-in types (`service`, `database`, `actor`, `system`, `data-asset`) do not need entries here — they have default mappings in the CLI. Only add entries for your extension node-types.

### `component-type` (required)

Controls the icon and color used in the rendered diagram. Must be one of the seven archify component types:

| Value | Default legend label | Typical use |
|-------|---------------------|-------------|
| `backend` | Backend | Services, modules, application logic |
| `frontend` | Frontend | Web UIs, presentation layers |
| `database` | Database | Databases, data stores |
| `cloud` | Cloud | Cloud services, SaaS, CDN, AI tooling |
| `external` | External | Actors, plugins, external systems |
| `security` | Security | Auth, encryption, secrets management |
| `messagebus` | Message bus | Event buses, queues, brokers |

### `legend-label` (optional)

Overrides the default legend label for a given `component-type`. Useful when you want the legend to use your domain vocabulary ("Module", "Plugin", "Skill") rather than the archify default ("Backend", "External", "Cloud").

If multiple node-types map to the same `component-type`, the last `legend-label` wins. Leave it empty if the default label is acceptable.

## Example

This is the mapping used by alistigo artifact diagrams:

```json
{
  "metadata": [
    { "x-alistigo-extension": "extensions/alistigo-node-types.calm-extension.json" },
    {
      "x-archify": {
        "node-types": {
          "module": { "component-type": "backend",  "legend-label": "Module" },
          "system": { "component-type": "frontend", "legend-label": "System" },
          "plugin": { "component-type": "external", "legend-label": "Plugin" },
          "skill":  { "component-type": "cloud",    "legend-label": "Skill"  }
        }
      }
    }
  ]
}
```

## JSON Schema

The schema for this metadata entry is bundled in the package:

```
node_modules/@alistigo/calm-to-archify/dist/schemas/x-archify-metadata.schema.json
```

You can reference it in a CALM document for VS Code auto-complete and validation (if your editor supports `$schema` on individual property values via a JSON Schema store or workspace settings). It is also importable from TypeScript:

```typescript
import { xArchifyMetadataSchema } from "@alistigo/calm-to-archify/schemas";
import type { XArchifyMetadata, NodeTypeHint, ComponentType } from "@alistigo/calm-to-archify/schemas";
```

The exported types:

| Export | Description |
|--------|-------------|
| `ComponentType` | Union of all valid archify component type strings |
| `NodeTypeHint` | Shape of a single node-type hint object |
| `XArchifyMetadata` | Shape of the full `{ "x-archify": { ... } }` entry |
| `xArchifyMetadataSchema` | JSON Schema as a typed `const` object (for validation at runtime) |

## Fallback behaviour

If a node-type has no entry in `x-archify`, the CLI falls back to its built-in switch:

| node-type | fallback component-type |
|-----------|------------------------|
| `actor` | `external` |
| `database` | `database` |
| `data-asset` | `external` |
| `system` | `backend` |
| `service` | `backend` (or `cloud`, `messagebus`, `frontend` based on name heuristics) |
| anything else | `backend` |

The `x-archify` hints always take priority over the fallback.
