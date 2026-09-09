---
status: accepted
date: 2026-06-12
deciders: Mikael Labrut
---

# ADR 0012 — Component Documentation Standard

**Status:** Accepted  
**Date:** 2026-06-12

## Context

Storybook is already installed in `packages/alistigo-list-components-react` and
provides an interactive catalog for developing and reviewing components in
isolation. As the number of packages with UI components grows, there is a risk
that new components ship without any visual documentation, making them harder to
discover, review, and test across themes.

There is currently no policy mandating that every component has a Storybook
story, and no automated check enforcing it.

## Decision

**Every React component file must have a co-located Storybook story.**

Concretely:

- A _component file_ is any `.tsx` file that matches one of these conventions:
  - **Apps pattern:** lives under `src/components/` (e.g., `src/components/Foo.tsx`)
  - **Packages pattern:** is the primary file of a `src/<Name>/` folder where
    the file name matches the folder name (e.g., `src/Foo/Foo.tsx`)
- Entry-point files (`main.tsx`, `host.tsx`), re-export barrels (`index.tsx`),
  utility hooks (`src/hooks/`), style files, and type-only files are exempt.
- The story file must be co-located: `Foo.tsx` → `Foo.stories.tsx` (same directory).
- Storybook must be installed in every package/app that owns component files.

## Enforcement

A monorepo-level bash script (`scripts/check-stories.sh`) scans all `apps/` and
`packages/` directories, detects component files by convention, and asserts
each has a sibling `.stories.tsx`. It runs as `pnpm qa:stories-check` and is
part of the `pnpm qa` gate.

CI blocks the merge if any component is missing a story.

## Consequences

**Positive:**
- Every component is visually reviewable in isolation before it ships.
- CI catches missing stories before merge — the rule is not advisory.
- Storybook serves as lightweight living documentation (props, variants, states).
- One central script covers the whole monorepo; no per-package boilerplate.

**Negative / tradeoffs accepted:**
- Each new component requires a story file; small overhead per PR.
- Storybook must be installed (and kept working) in every package with components.

## References

- [Storybook — component-driven development](https://storybook.js.org/)
- ADR 0001 — UI Library & i18n Stack (UI framework decision)
