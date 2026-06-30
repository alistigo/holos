---
name: alistigo-ai-m3
description: Plugin Architecture & First Plugin — checkbox-element plugin on top of the M2 base
status: backlog
created: 2026-06-11T14:20:20Z
---

# PRD: Alistigo AI — M3 Plugin Architecture & First Plugin (v0.4.0)

**Status:** Backlog
**Milestone:** M3
**Depends on:** M2 (v0.3.0)

## Problem Statement

M2 delivers a base list in a generic playground. Real-world lists need typed behaviours
(checkboxes, priorities, due dates, images). Adding these directly to core would couple
domain logic to every possible list type. A plugin system lets specialisations ship
independently without touching core.

## Goal

Introduce a plugin system on top of the M2 base. Ship `checkbox-element` as the seed
plugin that proves the pattern.

## Functional Requirements

| Req | Description |
|-----|-------------|
| F1 | Plugin interface: data shape + render + commands + events |
| F2 | `checkbox-element` plugin: complete/uncomplete actions on elements |
| F3 | Plugin registry and loading mechanism |
| F4 | `alistigo:plugins` field in document format |
| F5 | Validation warns/errors on missing plugins |
| F6 | All M1 `@m1` Gherkin scenarios continue to pass |
| F7 | New `@checkbox` feature group in `packages/alistigo-features/features/checkbox/` |

## Out of Scope

- Second list type / second plugin (M4)
- Host integration protocol (M5)

## Deliverables

- `packages/alistigo-plugin-api/` — plugin interface
- `packages/alistigo-plugin-checkbox/` — checkbox-element plugin
- `packages/alistigo-features/features/checkbox/` — acceptance specs with `@checkbox` tag

## Success Criteria

- All `@m1` scenarios still pass
- All `@checkbox` scenarios pass
- Plugin loads/validates without touching core domain

## References

- Architecture constraints: `projects/alistigo-ai/architecture.md`
- Plugin interface design: `projects/alistigo-ai/milestones.md` §M3
