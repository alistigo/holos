# Claude Command: Calm

Invoke the FINOS CALM architecture assistant to create, modify, or understand
CALM architecture models.

## Usage

```
/calm
/calm <request>
```

## What This Command Does

1. Invokes the `calm` skill, which specializes in FINOS Common Architecture
   Language Model (CALM) development.
2. The skill's first-interaction sequence loads the guidance files under
   `.agents/skills/calm/calm-prompts/` (architecture, node, relationship,
   interface, metadata, control, flow, pattern, documentation, standards,
   moment, timeline, decorator creation, plus CALM CLI instructions).
3. Proceeds with the requested CALM work — creating or modifying models under
   `packages/architecture/` (the `@alistigo/architecture` package) per
   [ADR 0027](../../../docs/adrs/0027-architecture-as-code-calm.md) and
   [ADR 0028](../../../docs/adrs/0028-package-first-repository-structure.md),
   validating against the CALM 1.2 schema, or explaining existing architecture.

This command is a thin passthrough — all CALM-specific behavior lives in the
`calm` skill, not here.

## Examples

```
/calm
/calm add a new node for the notification service
/calm validate packages/architecture/systems/alistigo-platform.arch.json
```
