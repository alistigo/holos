---
name: Gherkin features package conventions
description: User's preferences for how Gherkin BDD feature packages should be organized — folder layout, glossary structure, tag taxonomy, and what's portable vs project-specific
type: feedback
originSessionId: ab4ae8ca-dc05-4c91-bb0b-0472dcca95d8
---
When setting up a Gherkin features package for any project, follow these conventions — they were established for `packages/alistigo-features/` (April 2026) and the user wants the same shape across all features packages.

## Folder layout — by group, not by milestone

`features/` is organized **by group of features**, not by milestone. Each group is a folder. Milestones are tags, not folders.

- `features/core/` — base/foundational features
- `features/<other-group>/` — feature groups added later (often correspond to plugins)

Earlier alistigo-features used `features/m1-todo-list/`; the user explicitly corrected this to `features/core/` with `@m1` and `@core` as tags.

## Glossary structure — three sections, not flat

Glossary docs MUST split into:

1. **Entities** — things that live in the data layer. Each entity has a one-paragraph **definition** AND a list of **rules** (domain invariants).
2. **Actors** — who triggers scenarios. For most projects, just User to start.
3. **Actions** — what I previously called "verbs". The list of allowed verbs in step text.

Don't lump these together — the user wants the distinction visible in the doc structure.

**Why:** Entities map to the data layer (event-sourced model: events mutate entities). Actors and Actions are about the scenario surface. Mixing them obscures which are domain concepts vs interaction concepts.

## What's portable vs project-specific

- **Portable (lives as a skill `ai/skills/gherkin-features/`)**: organization rules, style guide, tooling setup (Prettier+plugin / Gherklin / custom validator), tag taxonomy *structure* (categories, required-vs-optional rules), glossary *structure* (Entities/Actors/Actions sections).
- **Project-specific (lives in each `<project>-features/` package)**: actual tag names, glossary contents (which entities, which actions), the feature files themselves.

Every features package MUST define its own `tags.md` + `src/tags.ts` AND its own `glossary.md`. The skill enforces the structure; the project fills in the content.

## How to apply

- New features package → invoke the `gherkin-features` skill, scaffold from its templates, then add project-specific tags and glossary.
- Refactoring features → if the user mentions "group" / "core" / "milestone tag", they almost certainly want the by-group folder layout, not by-milestone.
- Writing glossary entries → always include rules under each Entity, even if there's only one rule. Empty rules = the rules haven't been thought through yet.
