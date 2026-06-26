---
name: personal-website
description: Personal portfolio site hosted on GitHub Pages — bento grid layout, scroll-driven, generated from LinkedIn/resume data
status: backlog
created: 2026-06-15T19:30:11Z
---

# PRD: personal-website

## Executive Summary

A personal portfolio website for Mikael Labrut, a software architect, hosted on GitHub Pages at `mikael-labrut.alistigo.com`. The site is purely static (GitHub Actions handles the build), features a bento grid layout with scroll-driven tile animations, and is mostly generated from structured resume data (JSON Resume format) plus live GitHub data fetched at build time.

## Problem Statement

Mikael needs a professional web presence to promote himself as a software architect — for job opportunities, freelance leads, and general credibility in the NL tech market. A standard CV PDF is invisible; a well-designed personal website is a differentiator. There is no current site.

## User Stories

1. **As a recruiter**, I want to quickly understand Mikael's seniority level and stack so I can decide whether to reach out.
   - AC: Role, years of experience, and top skills are visible without scrolling on mobile.

2. **As a hiring manager**, I want to browse Mikael's recent experience and projects so I can assess technical depth.
   - AC: Work history is scannable (company, role, dates, one-line summary per role). Projects link to GitHub.

3. **As a collaborator**, I want to find Mikael's contact details and GitHub profile in under 10 seconds.
   - AC: Email, LinkedIn, and GitHub links are visible in the contact tile.

4. **As a mobile user**, I want the site to be readable and navigable on a phone without horizontal scrolling or tiny text.
   - AC: Lighthouse mobile score ≥ 90; single-column layout below 768px.

## Functional Requirements

1. **Sections**: Hero, About, Experience (timeline), Skills/tech stack, Projects, GitHub activity, Contact
2. **Data source**: `data/resume.json` (JSON Resume format) at repo root — used for Hero, About, Experience, Skills
3. **GitHub data**: public repos + profile for `MLKiiwy` fetched at build time via GitHub API (no auth token for public data)
4. **LinkedIn CLI**: A CLI tool to convert a LinkedIn data export (ZIP) into `data/resume.json`
5. **Scroll animations**: Tiles animate in (fade + slide up) as they enter the viewport via GSAP ScrollTrigger
6. **Smooth scroll**: Lenis replaces native scroll for a polished feel
7. **Custom domain**: Deployed to `mikael-labrut.alistigo.com`
8. **Automatic deploys**: GitHub Actions workflow builds on push to `main` and deploys to `gh-pages` branch

## Non-Functional Requirements

- Lighthouse mobile performance ≥ 90
- Lighthouse accessibility ≥ 95
- No JS shipped by default (Astro islands — only interactive tiles hydrate JS)
- Build time < 60 seconds on GitHub Actions
- `prefers-reduced-motion` respected by all animations
- TypeScript strict mode (matches Europa monorepo standards)

## Success Criteria

- [ ] Site is live at `mikael-labrut.alistigo.com`
- [ ] All 7 sections render with real data (not placeholder)
- [ ] Lighthouse mobile score ≥ 90 (performance + accessibility)
- [ ] Push to `main` automatically deploys within 3 minutes
- [ ] LinkedIn CLI converts export ZIP → `data/resume.json` in < 10 seconds
- [ ] Site passes `pnpm qa:lint` and `pnpm build:typecheck`

## Constraints & Assumptions

- Static only — no server-side rendering at runtime, no serverless functions
- GitHub Pages free tier (no private repo pages without Pro)
- LinkedIn export format: the standard ZIP download from LinkedIn "Get a copy of your data" (CSV-based)
- GitHub public API rate limit: 60 req/hour unauthenticated — sufficient for build-time fetching
- Must integrate as an Nx project in the Europa monorepo (`apps/personal-website/`)

## Out of Scope

- Blog / writing section (can be added later)
- Dark/light mode toggle (design is dark by default)
- CMS or admin interface for content editing
- Analytics or tracking
- Contact form with email sending (static only — link to email)
- LinkedIn real-time sync (CLI is a one-time / on-demand tool)

## Dependencies

- Europa monorepo toolchain (pnpm, Nx, Biome, Bun, TypeScript)
- `astro-bento-portfolio` theme (or equivalent) as starting point
- `MLKiiwy` GitHub account (public, for API data)
- Custom domain DNS access for `alistigo.com`
