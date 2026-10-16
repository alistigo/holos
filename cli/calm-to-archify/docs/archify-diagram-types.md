# archify diagram types and CALM mapping

## archify diagram types

archify supports 5 diagram types. Each produces a standalone interactive HTML file:

| `diagram_type` | Purpose | CALM mapping status |
|----------------|---------|---------------------|
| `architecture` | Component/service landscape — boxes, regions, connections | **Implemented** |
| `workflow` | Swimlane process flows — lanes, nodes, edges with roles | Planned |
| `sequence` | Message interactions between participants | Planned |
| `dataflow` | Multi-stage data pipeline / processing flows | Planned |
| `lifecycle` | State machine — states, transitions, lanes | Planned |

## Current behaviour: 1→1 (one CALM file → one HTML)

`calm-to-archify` currently performs a 1→1 transformation: one `.arch.calm.json` input produces one `.archify.json` intermediate and one `.archify.html` output, always as an `architecture` diagram.

The mapping extracts:
- **Components** from CALM `nodes` (excluding `group` node-types, which become boundaries)
- **Boundaries** from `composed-of` and `deployed-in` relationships
- **Connections** from `connects` and `interacts` relationships

## Roadmap: 1→N (one CALM file → multiple HTML files)

A CALM document can contain multiple kinds of diagrams worth visualising from the same source:

- The top-level nodes and relationships → `architecture` diagram
- Named CALM flows (e.g. a set of `connects` relationships tagged as a specific use-case flow) → `workflow` or `sequence` diagram
- A state machine modelled in CALM → `lifecycle` diagram

When 1→N is implemented, each output will use a distinct file name derived from the CALM document's `unique-id` and the diagram type:

| Input | Output |
|-------|--------|
| `my-system.arch.calm.json` | `my-system.architecture.archify.html` |
| `my-system.arch.calm.json` | `my-system.checkout-flow.workflow.archify.html` |
| `my-system.arch.calm.json` | `my-system.order-lifecycle.lifecycle.archify.html` |

Currently only the architecture output is produced; the naming convention will be stabilised before 1→N is implemented.

## Declaring additional diagram targets in CALM metadata

The planned mechanism uses `x-archify` metadata entries with a `diagrams` array alongside `node-types`:

```json
{
  "metadata": [
    {
      "x-archify": {
        "node-types": { ... },
        "diagrams": [
          {
            "type": "workflow",
            "title": "Checkout flow",
            "output-suffix": "checkout-flow",
            "filter": { "relationship-tag": "checkout-flow" }
          }
        ]
      }
    }
  ]
}
```

This API is **not yet implemented** — it documents the intended design so CALM authors can plan ahead.

## Click panel customisation (sources)

When a user clicks a component in the rendered HTML, archify shows a detail panel. You can populate it with up to three source references per component via the `sources` field in the archify JSON:

```json
{
  "id": "domain",
  "label": "Domain",
  "sources": [
    { "path": "packages/my-artifact-domain/src/index.ts", "label": "Source" },
    { "path": "packages/my-artifact-domain/README.md", "label": "Docs" }
  ]
}
```

Automatic `sources` population from CALM node data is not yet implemented in the CLI. It can be added via a future `x-archify` metadata extension once the mapping strategy is clear.
