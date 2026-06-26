# Document Format Changelog

This is the changelog for the **format itself** — separate from the project changelog. Bump on every change to the JSON Schema or the spec semantics.

## [Unreleased] — 1.0.0

### Initial public version

The format ships with three sections:

- **`meta`** — identity, dates, and the event-log integrity descriptor (`full` / `truncated` / `absent`).
- **`eventLog`** — append-only history. Optional. Mid-log edits forbidden; only prefix truncation allowed.
- **`projection`** — the current `ItemList`, derivable from the event log when one is present.

Event types: `ListCreated`, `ElementAdded`, `ElementDeleted`, `ListRenamed`. The base list uses `@type: Thing` for items; `@type: Action` is added by the `checkbox-element` plugin starting M2.

Spec lives at [`docs/spec.md`](spec.md). Validation is documented in [`docs/validation.md`](validation.md).
