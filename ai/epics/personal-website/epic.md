---
name: personal-website
status: backlog
created: 2026-06-15T19:30:11Z
updated: 2026-06-16T08:00:00Z
progress: 0%
prd: .claude/prds/personal-website.md
github: https://github.com/MLKiiwy/europa/issues/111
---

# Epic: personal-website

## Overview

Build a personal portfolio site for Mikael Labrut (software architect) hosted on GitHub Pages at `mikael-labrut.alistigo.com`. Bento grid layout, scroll-driven tile animations, all data sourced from `data/resume.json` (JSON Resume format) + GitHub API fetched at build time. Lives at `apps/personal-website/` in the Europa monorepo.

## Architecture Decisions

- **Framework**: Astro 5 (static output) — zero JS by default, TypeScript-first, Content Collections for typed data, fits Europa monorepo
- **Starting point**: `astro-bento-portfolio` theme (clone → replace data → restyle)
- **Styling**: Tailwind CSS v4 — mobile-first, utility classes, custom design tokens
- **Animations**: GSAP ScrollTrigger (scroll-driven tile reveals) + Lenis (smooth scroll)
- **Data**: `data/resume.json` (root `data/` dir, not inside the app) — JSON Resume open standard
- **GitHub data**: GitHub REST API v3 (public, unauthenticated) called at `astro build` time
- **LinkedIn → Resume**: Dedicated CLI app (`apps/linkedin-to-resume/`) using Clipanion + Bun
- **Deploy**: GitHub Actions → `peaceiris/actions-gh-pages` → `gh-pages` branch → custom domain

## Technical Approach

### Frontend Components (Astro)

```
apps/personal-website/src/
  components/
    tiles/
      BentoHero.astro
      BentoAbout.astro
      BentoExperience.astro
      BentoSkills.astro
      BentoProjects.astro
      BentoGitHub.astro
      BentoContact.astro
    layout/
      BentoGrid.astro
      Layout.astro
  pages/
    index.astro
  data/
    github.ts        # build-time GitHub API fetcher (MLKiiwy)
    resume.ts        # typed helpers to read data/resume.json
  scripts/
    animations.ts    # GSAP + Lenis init (client-side island)
```

### Data Layer

- `data/resume.json` at repo root → imported by Astro at build time via relative path
- GitHub API: `https://api.github.com/users/MLKiiwy/repos?sort=stars&per_page=6`
- JSON Resume TypeScript types defined in `apps/personal-website/src/types/resume.ts`

### LinkedIn CLI

```
apps/linkedin-to-resume/
  src/
    index.ts           # Clipanion CLI entry
    commands/
      convert.ts       # ConvertCommand: reads LinkedIn ZIP → outputs data/resume.json
    parsers/
      positions.ts     # parses Positions.csv
      education.ts     # parses Education.csv
      profile.ts       # parses Profile.csv
      skills.ts        # parses Skills.csv
  package.json
  project.json
```

### Infrastructure

- `apps/personal-website/public/CNAME` → `mikael-labrut.alistigo.com`
- `.github/workflows/personal-website.yml` → build + deploy on push to `main`
- `astro.config.ts`: `output: 'static'`, `site: 'https://mikael-labrut.alistigo.com'`

## Implementation Strategy

10 tasks in 4 dependency waves:

- **Wave 1** (parallel): Scaffold Astro app (001) + LinkedIn CLI (002)
- **Wave 2** (parallel after wave 1): Resume data + types (003), Bento layout (004), GitHub Actions (010)
- **Wave 3** (parallel after wave 2): Hero/About/Contact (005), Experience (006), Skills (007), Projects/GitHub (008)
- **Wave 4** (sequential after wave 3): Scroll animations (009)

## Task Breakdown Preview

| # | Task | Parallel | Depends On | Size |
|---|------|----------|------------|------|
| 001 | Scaffold Astro app + Nx wiring | with 002 | — | M |
| 002 | LinkedIn → JSON Resume CLI | with 001 | — | M |
| 003 | Resume data + TypeScript types | after 002 | 002 | S |
| 004 | Bento grid layout + Tailwind v4 | after 001 | 001 | M |
| 005 | Hero + About + Contact tiles | after 004 | 001, 004 | M |
| 006 | Experience timeline tile | after 003+004 | 001, 003, 004 | M |
| 007 | Skills tile | after 003+004 | 001, 003, 004 | S |
| 008 | Projects + GitHub activity tiles | after 004 | 001, 004 | M |
| 009 | GSAP + Lenis scroll animations | after all tiles | 005-008 | M |
| 010 | GitHub Actions + custom domain | after 001 | 001 | S |

## Dependencies

- `astro-bento-portfolio` GitHub repo available publicly
- `MLKiiwy` GitHub account public
- DNS access for `alistigo.com` subdomain (user action required)

## Success Criteria (Technical)

- `nx run personal-website:build` produces `dist/` with only static files, no errors
- All 7 sections render real data (none placeholder)
- `pnpm qa:lint` and `pnpm build:typecheck` pass
- Lighthouse mobile ≥ 90 (performance + accessibility)
- `linkedin-to-resume convert <linkedin-export.zip>` produces valid JSON Resume at `data/resume.json`

## Estimated Effort

Total: ~27 hours across 4 waves

## Tasks Created
- [ ] 001.md - Scaffold Astro app + Nx wiring (parallel: true)
- [ ] 002.md - LinkedIn to JSON Resume CLI (parallel: true)
- [ ] 003.md - Resume data file + TypeScript types (parallel: false)
- [ ] 004.md - Bento grid layout + Tailwind v4 design system (parallel: true)
- [ ] 005.md - Hero + About + Contact tiles (parallel: true)
- [ ] 006.md - Experience timeline tile (parallel: true)
- [ ] 007.md - Skills tile (parallel: true)
- [ ] 008.md - Projects + GitHub activity tiles (parallel: true)
- [ ] 009.md - GSAP ScrollTrigger + Lenis scroll animations (parallel: false)
- [ ] 010.md - GitHub Actions deploy + custom domain setup (parallel: true)

Total tasks: 10
Parallel tasks: 8
Sequential tasks: 2
Estimated total effort: 27 hours
