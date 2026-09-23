---
status: accepted
date: 2026-09-09
---

# ADR 0029 — Alistigo.com Public Website via Astro Starlight

**Status:** Accepted  
**Date:** 2026-09-09

## Context

Alistigo needed a public-facing website at `www.alistigo.com` to document the platform architecture, list architecture decisions, and provide an embedded playground. The site must be:
- Fast and static-first (no server required in prod)
- Developer-friendly (docs in Markdown/MDX)
- Consistent with the Holos monorepo tooling

## Decision

Use **Astro 5** with the **Starlight** documentation theme. The site lives in `websites/alistigo/` in the Holos monorepo and is registered as a pnpm workspace package.

**Key configuration:**
- Dark theme default
- 3 sidebar sections: Platform, Architecture Decisions, Playground
- GitHub social link to `https://github.com/alistigo/holos`
- Canonical URL: `https://www.alistigo.com`

**Local dev:** served via PM2 (`pnpm exec astro dev --host 0.0.0.0`) at port 4321.

## Alternatives Considered

- **Docusaurus** — rejected; heavier JS bundle, less Astro-native
- **VitePress** — rejected; Vue-centric, not aligned with React stack
- **Plain Astro (no Starlight)** — rejected; Starlight provides out-of-the-box search, TOC, sidebar, dark mode

## Consequences

- `pnpm-workspace.yaml` must include `websites/*` for pnpm to recognize the site as a workspace package
- The Starlight site is a separate pnpm workspace package (`@alistigo/alistigo-website`)
- PM2 starts the site alongside the artifact playground in dev mode
