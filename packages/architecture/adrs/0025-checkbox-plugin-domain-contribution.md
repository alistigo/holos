---
status: accepted
date: 2026-08-25
deciders: Mikael Labrut
---

# ADR 0025 — Checkbox Plugin: First Domain-Contribution Plugin

**Status:** Accepted
**Date:** 2026-08-25

## Context

ADR 0016 established the artifact plugin system with forward-compatibility stubs: `dataShape`, `render`, `commands`, and `events` were reserved on `AlistigoPlugin` as typed placeholders to signal that domain-contribution plugins were planned but not yet designed.

The checkbox plugin is the first plugin that contributes domain behavior — it adds a `checked` state to each list element. This requires:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Plugin state must be replay-deterministic from the event log | P1 |
| R2 | Multiple domain-contribution plugins must coexist without metadata collision | P1 |
| R3 | The host must not know about checkbox semantics — plugin is self-contained | P1 |
| R4 | Documents must declare which plugins were active for correct event log replay | P1 |
| R5 | Plugins must not own full list item rendering — host retains layout control | P1 |
| R6 | Plugin state must be testable in isolation without mounting the full host | P2 |

## Decision

Domain-contribution plugins own their event types, reducers, and bounded UI render zones. The host calls `plugin.reduce(elementId, currentMeta, event)` to replay the event log and build per-element plugin state. The plugin declares a `metadataKey` for namespace isolation, a `metadataSchema` for validation, and a `renderListElementLeading` render-prop for its UI slot.

Per-element metadata is stored under `alistigo:metadatas` keyed by plugin name on each list item. An `alistigo:plugins` section at the document root declares which plugins were active when the document was last saved.

The forward-compat stubs from ADR 0016 (`dataShape`, `render`, `commands`, `events`) are replaced by properly typed fields on `AlistigoPlugin`.

The data shape additions:

```typescript
// Added to AlistigoPlugin:
metadataKey?: string;           // "checkbox" for the checkbox plugin
metadataSchema?: unknown;       // JSON schema fragment for per-element metadata validation
reduce?(
  elementId: string,
  elementMeta: Record<string, unknown>,
  event: unknown
): Record<string, unknown>;
renderListElementLeading?(
  elementId: string,
  meta: Record<string, unknown>,
  onCommand: (name: string, payload: unknown) => void
): ReactNode;

// Added to AlistigoListItem:
"alistigo:metadatas"?: Record<string, Record<string, unknown>>;

// Added to AlistigoDocument:
"alistigo:plugins"?: AlistigoPluginRecord[];

interface AlistigoPluginRecord {
  name: string;
  version?: string;
  config?: Record<string, unknown>;
}

// New event type:
interface AlistigoListElementCheckedRecord extends AlistigoEventRecordBase {
  "alistigo:eventType": "ListElementChecked";
  "alistigo:listElementId": TypeIDString;
  checked: boolean;
}
```

The checkbox plugin uses `metadataKey: "checkbox"` and stores `{ selected: boolean }` under `alistigo:metadatas.checkbox` on each element.

## Rationale

### State model — reducer pattern over mutable plugin state

| Criterion | Mutable state per plugin | Reducer (chosen) |
|-----------|--------------------------|-----------------|
| Replay correctness | No — load order and timing matter | Yes — pure function, deterministic |
| Testability in isolation | Hard — requires full host mount | Easy — call `reduce()` with a fixture event log |
| Side-effects during load | Possible | None — pure function |
| Multi-plugin ordering | Fragile | Commutative per-plugin, independent across plugins |

State derived by replaying `plugin.reduce()` across the event log is identical regardless of when or where it runs (R1, R6). Mutable state would introduce ordering bugs when loading a document with a long event history.

### Metadata location — per-element `alistigo:metadatas` over top-level map

| Criterion | Top-level metadata map | Per-element `alistigo:metadatas` (chosen) |
|-----------|-----------------------|------------------------------------------|
| Data locality | Low — must cross-reference element by id | High — metadata lives on the element |
| Partial load / virtualization | Requires full map scan | Element carries its own state |
| Multiple plugins per element | Requires composite key | Natural — keyed by plugin name |

Keeping metadata co-located with the element avoids cross-element lookup and is consistent with how the event log already references elements by id (R2).

### Namespace isolation — plugin-declared `metadataKey`

Without a declared `metadataKey`, two plugins that both write to `alistigo:metadatas` could overwrite each other's state. The `metadataKey` is the plugin's claim on a namespace within `alistigo:metadatas`. The host validates uniqueness at plugin registration time and rejects duplicate keys. This enables multiple domain-contribution plugins to coexist on the same list without coordination (R2).

### UI boundary — `renderListElementLeading` over `renderListItem`

| Slot | Host control retained | Plugin scope |
|------|----------------------|-------------|
| `renderListItem` (full item) | No — plugin owns the entire row | Full: text, delete, drag, handles |
| `renderListElementLeading` (chosen) | Yes — host owns layout, delete, drag | Leading edge only: icon, checkbox, badge |

Giving plugins full `renderListItem` ownership would prevent the host from guaranteeing consistent delete controls, drag handles, and element text across all plugins — and would make two plugins rendering the same element conflict irreconcilably. The leading slot is a bounded, well-defined zone (R3, R5). The host iterates active plugins and calls whichever exposes `renderListElementLeading` for each element.

### Document-level plugin registry — `alistigo:plugins` at document root

A `ListElementChecked` event in the log is opaque without knowing that the checkbox plugin was active. When replaying the event log (on load, on export, or in a future sync scenario), the host needs to know which plugins to instantiate and call `reduce()` on. The `alistigo:plugins` section is written by the host on every save and reflects the active plugin set at that point in time (R4).

### Forward-compat stubs — replaced, not extended

ADR 0016's stubs (`dataShape`, `render`, `commands`, `events`) were deliberately untyped placeholders. Now that the domain-contribution contract is designed, they are removed and replaced by properly typed fields (`reduce`, `renderListElementLeading`, `metadataKey`, `metadataSchema`). Keeping the stubs alongside the real fields would create a confusing dual API surface.

## Consequences

**Positive:**
- Plugins are fully self-contained — the host calls `reduce()` and `renderListElementLeading()` without knowing what the plugin does
- State is replay-deterministic: the event log + `alistigo:plugins` section is the complete source of truth
- Multiple domain plugins can coexist without conflict as long as they declare distinct `metadataKey` values
- Plugin logic (reducer) is testable with a plain function call, no React mount required

**Negative / tradeoffs accepted:**
- The host must call `plugin.reduce()` across the full event log for each element on document load: O(n × m) where n = events and m = active plugins. This is acceptable for list sizes in M1; a materialized snapshot can be added if performance becomes a concern
- Plugins cannot read or mutate each other's metadata — cross-plugin coordination requires a host-mediated command channel (not in scope for M1)
- The `alistigo:plugins` section records the plugin set at last save, not a full history: if a plugin is removed and the document re-saved, its events remain in the log but no reducer runs for them on reload

## Alternatives considered

- **Plugin owns full list item rendering (`renderListItem`)** — rejected: conflicts with other plugins and prevents the host from guaranteeing consistent layout, delete handles, and drag behaviour (R5)
- **Store plugin state in a separate side store** — rejected: breaks document self-containment and requires a sync mechanism between the document and the side store; inconsistent with the ADR 0017 storage abstraction
- **Schema registry server for plugin metadata schemas** — rejected: out of scope for M1; `metadataSchema` is declared locally on the plugin and validated in-process

## References

- ADR 0016 — Artifact Plugin System (forward-compat stubs now replaced by this ADR)
- ADR 0024 — Shared-List View: Actor Registry in Document (denormalized document data pattern)
