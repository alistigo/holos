---
name: list-shared-view-and-checkbox-plugin
status: completed
created: 2026-08-25T16:00:33Z
updated: 2026-08-26T00:00:00Z
progress: 100%
prd: .claude/prds/list-shared-view-and-checkbox-plugin.md
github: https://github.com/alistigo/holos/issues/102
---

# Epic: list-shared-view-and-checkbox-plugin

## Overview

Two coordinated features for the list artifact, delivered as one epic because they share a foundational schema change (`list-document-format`) and establish the full pattern for domain-contribution plugins.

**Feature 1 — Shared-List View:** Store actor public info (userId, pseudo, avatar) in the list document under `alistigo:actors`. Derive per-element attribution from the event log. Show avatar + pseudo + relative date below each element when ≥2 user actors exist. Wire the user plugin's `user:changed` event to keep this section up to date.

**Feature 2 — Checkbox Plugin:** First domain-contribution plugin. Adds a checkbox (checked/unchecked) to each list element via a plugin-owned metadata key (`metadatas.checkbox.selected`). Introduces a new event type `ListElementChecked`. Proves the full domain-contribution plugin lifecycle: event type → reducer → command → UI zone.

## Architecture Decisions

- **ADR 0024** — `docs/adrs/0024-shared-list-view-actor-registry.md` — store actor identity inside the document, populated via `user:changed`, not looked up at render time from the plugin store.
- **ADR 0025** — `docs/adrs/0025-checkbox-plugin-domain-contribution.md` — domain-contribution plugins own their event types, reducers, and UI render zones; the host calls `plugin.reduce()` to build per-element state from the event log.

## Technical Approach

### Schema (list-document-format, task 002)
All schema changes are additive (optional fields), so existing documents stay valid:
- `AlistigoDocument` gains `alistigo:actors?` and `alistigo:plugins?`
- `AlistigoListItem` gains `alistigo:metadatas?`
- New union member: `AlistigoListElementCheckedRecord`
- JSON schema bumped to allow these, `SCHEMA_VERSION` → `"1.1.0"`

### Serializer extension (task 002)
`ListDocumentSerializer.serialize()` gains an optional second argument: `{ actorsById?: Map<string, ActorPublicInfo> }`. When provided it writes the actors section.

### Plugin API extension (task 005)
`AlistigoPlugin` gains four optional domain-contribution fields:
- `metadataKey?` — plugin's key inside `alistigo:metadatas`
- `metadataSchema?` — JSON schema fragment (for documentation/validation)
- `reduce?(elementMeta, event)` — pure reducer to build per-element state from the event log
- `renderListElementLeading?(elementId, meta, onCommand)` — React render zone at the leading edge of each list item

### Shared-list view data flow
`user:changed` → artifact-list host updates `actorsById` map → `ListDocumentSerializer.serialize()` writes `alistigo:actors` → projection builder scans event log + actors section → per-element attribution object added to `AlistigoProjection` items → `ListView` renders attribution row when `userActors.length > 1`.

### Checkbox plugin data flow
`onCommand("checkListElement", {elementId, checked})` → `createCheckListElementEvent()` → applied to list aggregate → `ListDocumentSerializer.serialize()` writes `ListElementChecked` to event log + `metadatas.checkbox.selected` on the item → persisted → on reload, `plugin.reduce()` replays events → checkbox renders with correct state.

### New package: artifact-checkbox-plugin (task 006)
Scaffolded with `scripts/new-package.sh`. Exports: `checkboxPlugin` (default), `createCheckListElementEvent`, `CheckboxListElementLeading` (React component). Has its own Storybook.

## Implementation Strategy

Sequential foundation (task 002), then parallel domain work (003, 004, 005), then plugin package (006), then unified ListView UI (007, single agent to avoid conflicts), then host wiring and feature files (008, 009).

## Task Breakdown Preview

- [x] 001 - Write ADR 0024 + ADR 0025
- [x] 002 - list-document-format: schema + serializer (foundation)
- [x] 003 - Shared-list view: projection layer (parallel after 002)
- [x] 004 - User plugin → actors section bridge (parallel after 002)
- [x] 005 - artifact-plugin-api: domain-contribution extension (parallel after 002)
- [x] 006 - artifact-checkbox-plugin: new package (after 005)
- [x] 007 - list-components-react: ListView UI — attribution + plugin zones (after 003+006)
- [x] 008 - Artifact-list host wiring: register checkbox + command dispatch (after 006+007)
- [x] 009 - Gherkin feature files: checkbox scenarios (after 008)

## Dependencies
- `@alistigo/artifact-user-plugin` — already emits `user:changed` ✅
- `@alistigo/artifact-plugin-api` — being extended in this epic

## Success Criteria (Technical)
- All packages build and typecheck cleanly
- Serializer round-trips documents with actors + metadatas sections
- `ListView` correctly conditionally shows/hides attribution
- Checkbox state survives serialize/deserialize cycle
- Gherkin scenarios written for all checkbox persistence cases

## Estimated Effort
- Total tasks: 9
- Parallel tasks: 6 (001, 003, 004, 005, 008, 009)
- Sequential tasks: 3 (002, 006, 007)
- Estimated: 3–4 days parallel execution

## Tasks Created
- [x] 001.md - Write ADR 0024 + ADR 0025 (parallel: true)
- [x] 002.md - list-document-format schema + serializer (parallel: false)
- [x] 003.md - Shared-list view: projection layer (parallel: true)
- [x] 004.md - User plugin → actors section bridge (parallel: true)
- [x] 005.md - artifact-plugin-api: domain-contribution extension (parallel: true)
- [x] 006.md - artifact-checkbox-plugin: new package (parallel: false)
- [x] 007.md - ListView UI: attribution + plugin zones (parallel: false)
- [x] 008.md - Artifact-list host wiring (parallel: true)
- [x] 009.md - Gherkin feature files: checkbox scenarios (parallel: true)

Total tasks: 9
Parallel tasks: 6
Sequential tasks: 3
