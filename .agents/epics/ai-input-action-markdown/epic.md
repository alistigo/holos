---
name: ai-input-action-markdown
status: in-progress
created: 2026-08-15T00:00:00Z
updated: 2026-08-15T00:00:00Z
progress: 10%
prd: (no PRD — driven by ADR-0021)
github: (will be set on sync)
---

# Epic: AI Input Action — Markdown document source + lifecycle cleanup

## Overview

Replace the complex JSON-LD `#alistigo-document` injection with a simple markdown `#ai-input-action`
tag that AI writes and the artifact reads on boot. Pair this with a draft mode read-only banner,
lazy storage initialization, and removal of the dead AI API tab.

ADR: docs/adrs/0021-ai-input-action-markdown.md

## Architecture Decisions

1. **Markdown-first AI input**: AI writes a `<script id="ai-input-action" type="text/markdown">` tag.
   The artifact parses it into an `AlistigoDocument` on boot and removes the tag from the DOM.

2. **Lazy storage**: `seedIfEmpty()` is no longer called at mount. It is called on the first user action
   inside the action dispatch path. Pure reads never touch storage.

3. **Draft = read-only + banner**: `artifactContext()` from `@alistigo/claude-artifact-api` determines
   draft/published. In draft, the full list renders but editing is disabled and a banner explains why.

4. **AI API deleted**: the `ai-chat-async-api` dependency is dropped from the playground and the
   "AI API" tab is removed from `ArtifactViewPanel`.

## Task Breakdown

| Task | Title | Parallel | Depends On |
|------|-------|----------|-----------|
| 001  | ADR-0021 (already written) | — | — |
| 002  | Markdown parser + AiInputAction in artifact-list | Yes | — |
| 003  | Update auto-mount to use #ai-input-action | No | 002 |
| 004  | Lazy storage — remove seedIfEmpty from mount, call on first edit | No | 003 |
| 005  | Draft mode read-only banner in artifact-list | No | 003 |
| 006  | Remove AI API tab from playground + update buildIframeSrcdoc | Yes | — |
| 007  | Update playground to inject markdown instead of JSON document | No | 006 |
| 008  | Update SKILL.md with new markdown format | Yes | 002 |
| 009  | Build + typecheck pass | No | all |

## Tasks Created

- [x] 001.md - ADR-0021 written
- [ ] 002.md - Markdown parser + AiInputAction in artifact-list
- [ ] 003.md - Update auto-mount to use #ai-input-action
- [ ] 004.md - Lazy storage: remove seedIfEmpty from mount
- [ ] 005.md - Draft mode read-only banner
- [ ] 006.md - Remove AI API tab from playground
- [ ] 007.md - Update playground markdown injection
- [ ] 008.md - Update SKILL.md with new markdown format
- [ ] 009.md - Build + typecheck pass

Total tasks: 9 (1 done)
