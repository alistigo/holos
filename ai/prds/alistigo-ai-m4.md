---
name: alistigo-ai-m4
description: Second List Type via Plugins — prove the plugin system by composing a different list type
status: backlog
created: 2026-06-11T14:20:20Z
---

# PRD: Alistigo AI — M4 Second List Type via Plugins (v0.5.0)

**Status:** Backlog
**Milestone:** M4
**Depends on:** M3 (v0.4.0)

## Goal

Prove the plugin system by composing a different list type (grocery or wishlist — TBD at
M4 planning time) without modifying core or the checkbox plugin.

## Functional Requirements

| Req | Description |
|-----|-------------|
| F1 | One additional list type (grocery or wishlist — decision deferred to M4 planning) |
| F2 | 2–3 new plugins (quantity, category, image, price, or priority — TBD) |
| F3 | Sample documents for the new list type |
| F4 | New feature groups + matching tags in `packages/alistigo-features/` |

## Out of Scope

- Host integration protocol (M5)
- Drag-and-drop reordering

## Success Criteria

- New list type renders without changes to core or checkbox plugin
- All prior `@m1` and `@checkbox` scenarios still pass

## References

- `projects/alistigo-ai/milestones.md` §M4
- Architecture constraints: `projects/alistigo-ai/architecture.md`
