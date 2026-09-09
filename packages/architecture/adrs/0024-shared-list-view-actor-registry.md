---
status: accepted
date: 2026-08-25
deciders: Mikael Labrut
---

# ADR 0024 — Shared-List View: Actor Registry in Document

**Status:** Accepted
**Date:** 2026-08-25

## Context

The list document stores an `actorId` on every event (the device-scoped identity established in ADR 0022), but no public user info — no pseudo, no avatar. When a list is shared between multiple users, there is no visual attribution: the UI cannot show who added which element.

The requirements for attribution are:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | Attribution must work offline — no live lookup at render time | P1 |
| R2 | Actor info must travel with the document for future export/share | P1 |
| R3 | Solo users must see no extra attribution UI | P1 |
| R4 | Identity updates (pseudo/avatar changes) must propagate to open documents | P2 |
| R5 | No additional bundle cost for date formatting beyond what is already common | P2 |

## Decision

Store a denormalized `alistigo:actors` section in the list document itself. Each entry maps an `actorId` to the user's public info (userId, pseudo, avatar) at the time of their last action in that document.

The user plugin's `user:changed` event triggers the artifact-list host to upsert the current actor's public info into the `alistigo:actors` section before each save. The host does not look up actor info from the plugin store at render time.

Attribution is rendered per element (avatar + pseudo + relative date) **only when ≥ 2 distinct user actors are present in the document** — solo users see no extra UI.

Relative dates are formatted using `date-fns` `formatDistanceToNow`.

The data shape added to `AlistigoDocument`:

```typescript
interface AlistigoActorRecord {
  "alistigo:actorId": TypeIDString;
  "alistigo:userId": string;
  "alistigo:pseudo": string;
  "alistigo:avatar": string; // base64 SVG data URL
}

// Added to AlistigoDocument:
"alistigo:actors"?: AlistigoActorRecord[];
```

## Rationale

### Storage — denormalized in document vs plugin store lookup at render time

| Criterion | Plugin store lookup | Denormalized in document (chosen) |
|-----------|--------------------|------------------------------------|
| Works offline | No — requires user plugin to be present and storage to be accessible | Yes |
| Self-contained for export | No — actor data lives outside the document | Yes |
| Stale data risk | Always fresh | Yes — pseudo/avatar may lag one session |
| Implementation complexity | High — async lookup per actorId during render | Low — read from document on load |

Documents must be self-contained: a list shared via export or opened on a device without the user plugin must still show attribution. Lookup at render time would break both cases (R1, R2).

### Trigger — `user:changed` over `user:setup`

`user:setup` fires once when the plugin initializes. It would miss identity updates mid-session (user changes their pseudo or avatar while the document is open). `user:changed` fires on every identity mutation, ensuring the actor record in the document always reflects the latest public info at save time (R4).

### Date formatting — `date-fns` `formatDistanceToNow` over alternatives

| Library | Tree-shakeable | Size impact | Locale overhead |
|---------|---------------|-------------|-----------------|
| **date-fns** `formatDistanceToNow` | Yes — single function import | ~2 KB | None unless explicitly imported |
| timeago.js | Partial | ~4 KB | Bundled |
| dayjs `relativeTime` plugin | Partial | ~3 KB + plugin | Plugin required |

`date-fns` is already common in TypeScript projects, is fully tree-shakeable, and imports a single function with no locale overhead for the default English format (R5).

### Attribution visibility — conditional on ≥ 2 distinct user actors

A solo user editing their own list gains nothing from seeing "you added this 2 minutes ago" on every element — it adds visual noise with zero information value. Attribution is meaningful only when more than one person has contributed (R3). The threshold is the count of distinct `actorId` values in `alistigo:actors`, not the count of events.

## Consequences

**Positive:**
- Documents are fully self-contained — attribution works offline and survives export
- Event log + `alistigo:actors` section is enough to derive full attribution history without any external dependency
- The user plugin is not a hard requirement for rendering attribution: if the plugin is absent, `alistigo:actors` is simply not populated and attribution is silently hidden

**Negative / tradeoffs accepted:**
- Actor info is denormalized: if a user changes their pseudo or avatar, old list items show the previous info until the next session opens and saves the document (the `user:changed` upsert updates the record for future saves, not past ones)
- Avatar is stored inline as a base64 SVG data URL: adds bytes to the document per actor; mitigated by jdenticon SVGs being small (typically < 2 KB each)

## Alternatives considered

- **Lookup from user plugin store at render time** — rejected: requires the user plugin to be present and storage to be accessible; breaks offline and export (R1, R2)
- **Store only actorId, look up from a shared identity server** — rejected: out of scope for M1; identity is device-scoped per ADR 0022, there is no shared identity server

## References

- ADR 0022 — Artifact User Plugin: Device-Scoped Identity (`user:changed` event, actor identity model)
- ADR 0016 — Artifact Plugin System (plugin event contract)
