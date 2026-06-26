---
name: alistigo-ai-m5
description: Host ↔ Iframe Protocol — postMessage protocol for real embedded widget behavior
status: backlog
created: 2026-06-11T14:20:20Z
---

# PRD: Alistigo AI — M5 Host ↔ Iframe Protocol (v0.6.0)

**Status:** Backlog
**Milestone:** M5
**Depends on:** M4 (v0.5.0)

## Goal

Make Alistigo a real embedded widget — a host page can load, push, and receive documents
via a versioned postMessage protocol.

## Functional Requirements

| Req | Description |
|-----|-------------|
| F1 | `alistigo:ready` — widget announces readiness to host |
| F2 | `alistigo:document` — host pushes initial document |
| F3 | `alistigo:patch` — bidirectional incremental updates |
| F4 | `alistigo:state` — widget reports current state to host |
| F5 | Versioned message envelope with schema validation |
| F6 | Reference host demo page (`apps/alistigo-host-demo/`) |
| F7 | Theming hooks via CSS custom properties (host injects JSON theme) |
| F8 | Security: origin allowlist + payload validation; out-of-allowlist origins silently rejected |

## Out of Scope

- Production embedding in third-party hosts (post-1.0)

## Deliverables

- `packages/alistigo-host-protocol/` — protocol spec + TypeScript types
- `apps/alistigo-host-demo/` — reference host page
- `packages/alistigo-features/features/host-protocol/` — acceptance specs with `@host-protocol` tag

## Success Criteria

- Reference host can load and mutate a list purely via postMessage
- Origin outside allowlist is silently rejected (no error thrown, no state change)
- All prior milestone scenarios (`@m1`, `@checkbox`, `@m4`) still pass

## References

- `projects/alistigo-ai/milestones.md` §M5
- `projects/alistigo-ai/architecture.md` §4 (postMessage runtime model)
