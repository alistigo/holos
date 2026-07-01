---
name: alistigo-m1-deployment
status: in-progress
created: 2026-06-02T07:55:47Z
updated: 2026-06-02T07:55:47Z
progress: 0%
prd: .claude/prds/alistigo-ai-m1.md
github: https://github.com/MLKiiwy/europa/issues/70
---

# Alistigo M1 Supplement — Public Deployment

Forgotten M1 tasks: deploy the widget publicly so AI chatbots can embed it.

## Context

M1 shipped the Alistigo list widget but without a public deployment. This epic adds:
- ADRs documenting deployment decisions (based on Claude artifact CSP research)
- npm publishing of the `alistigo-artifact-list` UMD bundle for Claude artifact use
- GitHub Pages deployment of the SPA for regular-web demos/testing
- Storage packages for Claude artifact context (`window.storage`) and regular web (`localStorage`)
- Updated llms.txt and Claude skill with embedding instructions

## Tasks
- [ ] #71 — Write ADRs (research → decisions documented)
- [ ] #72 — Create alistigo-local-storage-repository package
- [ ] #73 — Create alistigo-claude-artifact-list-storage package
- [ ] #74 — Update embedded app boot with storage auto-detection
- [ ] #75 — Create alistigo-artifact-list UMD bundle
- [ ] #76 — GitHub Pages deployment (Vite fix + workflow)
- [ ] #77 — npm publish workflow (alistigo-artifact-list only)
- [ ] #78 — Update llms.txt + create Claude skill
- [ ] #89 — Write ADRs: observability, debug API, analytics (009.md)
- [ ] #90 — Sentry error monitoring in @alistigo/artifact-list (010.md)
- [ ] #91 — Browser debug API — Alistigo.version and Alistigo.about (011.md)
- [ ] #92 — PostHog analytics in @alistigo/artifact-list (012.md)
