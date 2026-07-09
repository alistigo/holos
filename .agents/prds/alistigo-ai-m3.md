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
| F1 | Plugin interface: data shape + render + commands + events — implemented by `@alistigo/artifact-plugin-api` (see Note below), not a second `alistigo-plugin-api` package |
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

- ~~`packages/alistigo-plugin-api/` — plugin interface~~ superseded — see Note below
- `packages/alistigo-plugin-checkbox/` — checkbox-element plugin, implementing `AlistigoPlugin` from `@alistigo/artifact-plugin-api`
- `packages/alistigo-features/features/checkbox/` — acceptance specs with `@checkbox` tag

## Note — Plugin Interface Package (added 2026-07-09)

The plugin-interface deliverable (F1) is **already built**, as part of the standalone
`alistigo-artifact-plugins` epic (see `.agents/prds/alistigo-artifact-plugins.md` and
`docs/adrs/0016-artifact-plugin-system.md`): `@alistigo/artifact-plugin-api`
(`packages/alistigo-artifact-plugin-api/`). That epic introduced one unified
`AlistigoPlugin` interface deliberately designed to serve both artifact-lifecycle/
infra plugins (Sentry, PostHog, built in that epic) and this milestone's future
domain-contribution plugins (checkbox etc.) — via the interface's `dataShape`/
`render`/`commands`/`events` fields, typed but unconsumed until M3 actually builds
`checkbox-element`. When M3 work starts, implement `checkbox-element` against the
existing `@alistigo/artifact-plugin-api` package rather than scaffolding a second,
competing `alistigo-plugin-api` package.

## Success Criteria

- All `@m1` scenarios still pass
- All `@checkbox` scenarios pass
- Plugin loads/validates without touching core domain

## References

- Architecture constraints: `projects/alistigo-ai/architecture.md`
- Plugin interface design: `projects/alistigo-ai/milestones.md` §M3
