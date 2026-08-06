---
name: artifact-claude-capabilities-demo
description: Expand artifact-storage-explorer into a comprehensive tabbed demo of all Claude artifact iframe APIs
status: active
created: 2026-08-06T20:14:46Z
---

# PRD: artifact-claude-capabilities-demo

## Problem

`artifact-storage-explorer` demonstrates only one of the many APIs Claude injects into artifact iframes (`window.storage`). Developers wanting to understand what's possible inside a Claude artifact have no single reference showing all the capabilities together.

## Goal

Rename `artifact-storage-explorer` to `artifact-claude-capabilities-demo` and expand it into a **tabbed capabilities showcase** that covers every major API surfaced by the Claude inject-script bridge:

| Tab | API demonstrated |
|-----|-----------------|
| Storage | `window.storage` (existing explorer) |
| AI | `window.claude.complete()` |
| File Generation | `URL.createObjectURL` override → parent-triggered download |
| API Calls | `window.fetch` override → network proxy |
| External Navigation | `<a>` link interception + `window.open` override |

## Scope

- Rename both packages: `artifact-storage-explorer` → `artifact-claude-capabilities-demo`, `artifact-storage-explorer-skill` → `artifact-claude-capabilities-demo-skill`
- Deprecate old npm packages with a forwarding message
- Build tab UI with Tailwind (no external component library)
- Scope draft-mode overlay to the Storage tab only (other tabs work in draft)
- Update artifact-manager registry and playground
- Rewrite skill SKILL.md to cover all 5 tabs

## Out of Scope

- Storybook for new tab components (developer tool, not a component library)
- i18n (English only)
- Persistent call/request history (in-memory per session)

## Success Criteria

- All 5 tabs render in the playground in Published mode
- Storage tab: draft overlay appears, other tabs work normally in draft
- AI tab: prompt → pending → response cycle works end-to-end
- File Generation: valid JSON → download triggers file in parent
- API Calls: GET https://httpbin.org/get → status 200 + response body shown
- External Navigation: links open via parent, window.open triggers parent tab
- Old npm packages show deprecation warning after `npm deprecate`
- Skill SKILL.md triggers match all 5 demo areas
