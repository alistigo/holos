---
name: list-shared-view-and-checkbox-plugin
description: Shared-list attribution view and first domain-contribution plugin (checkbox) for the list artifact
status: active
created: 2026-08-25T16:00:33Z
---

# PRD: list-shared-view-and-checkbox-plugin

## Executive Summary

Two related enhancements to the list artifact. First, when a list is used by more than one person, each element should show who added it — surfacing the social layer already implicit in the event log. Second, a checkbox plugin adds a first class "done" state to each element, proving out the domain-contribution plugin architecture.

## Problem Statement

**Shared-List View:** The list event log already records *who* did each action (actorId), but the document stores no public identity data (name, avatar). When two people share a list, there is no visual indication of who added which item. The actor profile lives in the user plugin's private store, not in the shared document.

**Checkbox Plugin:** The list artifact has no way to mark elements as "done". The plugin architecture has forward-compat stubs (`dataShape`, `render`, `commands`, `events`) but no plugin has ever consumed them. There is no pattern for a plugin to extend the document schema, contribute events, or render UI inside list elements.

## User Stories

### Shared-List View
- As a user sharing a list with a friend, I want to see whose avatar and name appears below each element so I know who added it.
- As a solo user, I should not see any attribution UI so the list stays clean.
- As a user, I want the "added X ago" date to be human-readable (e.g. "3 hours ago") not a raw timestamp.

### Checkbox Plugin
- As a user with the checkbox plugin active, I want a checkbox on each element so I can mark items done.
- As a user, when I check an element and reload the page, it should still be checked.
- As a user, checking one element should not affect others.

## Functional Requirements

### Shared-List View
- FR1: The document must store an `alistigo:actors` section: a list of actor records (actorId, userId, pseudo, avatar).
- FR2: The user plugin's `user:changed` event must populate/update the actor record in the document.
- FR3: Attribution (avatar + pseudo + relative date) must appear below each element only when ≥2 distinct user actors are in the document.
- FR4: The relative date must be updated from a well-known npm library (`date-fns` formatDistanceToNow).
- FR5: The projection layer must derive per-element attribution from the event log + actors section.
- FR6: Storybook stories must cover: single-actor (no attribution), multi-actor (attribution shown).

### Checkbox Plugin
- FR7: The document must support `alistigo:metadatas` per element (plugin-keyed map) and `alistigo:plugins` at the document root.
- FR8: A new `ListElementChecked` event type must be added to the document schema.
- FR9: The plugin API must be extended to support domain-contribution: metadataKey, metadataSchema, reduce(), renderListElementLeading().
- FR10: A new package `@alistigo/artifact-checkbox-plugin` must implement this contract.
- FR11: The checkbox plugin must contribute a checkbox UI rendered as a leading slot in each list element.
- FR12: Checking/unchecking must produce a `ListElementChecked` event that is persisted and replayable.
- FR13: The checkbox plugin must have its own Storybook stories (checked, unchecked, disabled).
- FR14: New Gherkin feature file must cover: check persists, uncheck persists, per-element isolation.

## Non-Functional Requirements
- No regression to existing tests.
- `alistigo:actors`, `alistigo:metadatas`, `alistigo:plugins` are all optional fields — existing documents remain valid.
- Schema version bumps to 1.1.0.
- The list artifact host must not import any symbol directly from a plugin package.

## Success Criteria
- [x] `pnpm build:typecheck` passes with no new errors.
- [x] `pnpm test` passes including new serializer tests.
- [x] Storybook renders MultiActorSharedView with avatar + pseudo + relative date.
- [x] Storybook renders WithCheckboxPlugin with a checkbox on each element.
- [x] Checking an element, reloading, observing it still checked.
- [x] Checkbox Gherkin scenarios are written and tagged.

## Constraints & Assumptions
- Shared-list identity is device-scoped (ADR 0022) — no server-side user lookup.
- The plugin must not be a required import of `artifact-list`; it is loaded via the plugin registry.
- Avatar is a base64 SVG data URL (from the user plugin).

## Out of Scope
- Server-side identity or cross-device user sync.
- Other plugins (sorting, tagging, due-dates).
- Step definitions / E2E test runner wiring for Gherkin (scenarios only).
- A UI to enable/disable the checkbox plugin at runtime.

## Dependencies
- `@alistigo/artifact-user-plugin` (must already emit `user:changed` — ✅ done in ADR 0022)
- `@alistigo/artifact-plugin-api` (must be extended)
- `@alistigo/list-document-format` (types + serializer)
- `date-fns` (relative date formatting)
