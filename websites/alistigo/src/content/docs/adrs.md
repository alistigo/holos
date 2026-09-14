---
title: Architecture Decision Records
description: All architectural decisions for the Alistigo platform — what was decided, why, and what alternatives were rejected.
---

Architecture Decision Records capture every significant architectural choice made in the Alistigo platform. Each ADR explains the context, the decision, the alternatives considered, and the trade-offs accepted.

Source of truth: [`packages/architecture/adrs/`](https://github.com/alistigo/holos/tree/main/packages/architecture/adrs)

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | UI Library & i18n Stack | Accepted | 2026-05-02 |
| 0002 | Branch Protection & Security | Accepted | 2026-06-10 |
| 0003 | npm Publishing via OIDC Trusted Publisher | Superseded | 2026-06-10 |
| 0004 | Artifact Delivery Strategy — npm/jsDelivr over GitHub Pages | Accepted | 2026-06-02 |
| 0005 | Storage in Claude Artifact Context — window.storage over localStorage | Accepted | 2026-06-02 |
| 0006 | GitHub Pages Scope — Testing/Demos Only | Accepted | 2026-06-02 |
| 0007 | Logging Library | Accepted | 2026-06-03 |
| 0008 | Error Monitoring | Accepted | 2026-06-09 |
| 0009 | Browser Debug API | Accepted | 2026-06-09 |
| 0010 | Product Analytics | Accepted | 2026-06-09 |
| 0011 | jsDelivr CDN Versioning Strategy | Accepted | 2026-06-12 |
| 0012 | Component Documentation Standard | Accepted | 2026-06-12 |
| 0013 | Release Strategy | Accepted | 2026-06-10 |
| 0014 | npm Publishing via NPM_TOKEN | Accepted | 2026-06-11 |
| 0015 | Agent Skills Standard (agentskills.io) | Accepted | 2026-06-30 |
| 0016 | Composable Artifact Plugin System | Accepted | 2026-07-09 |
| 0017 | Storage Plugin System | Accepted | 2026-07-24 |
| 0018 | Alistigo as a Platform for AI Artifacts | Accepted | 2026-07-27 |
| 0019 | Claude Artifact Lifecycle — Draft vs. Published Storage Behavior | Accepted | 2026-08-06 |
| 0020 | Claude Artifact `window.fetch` is Anthropic-API-Only | Accepted | 2026-08-09 |
| 0021 | AI Input Action — Markdown as Document Source Format | Accepted | 2026-08-15 |
| 0022 | Artifact User Plugin: Device-Scoped Identity | Accepted | 2026-08-20 |
| 0023 | Entity IDs: TypeID as the Preferred Format | Accepted | 2026-08-20 |
| 0024 | Shared-List View: Actor Registry in Document | Accepted | 2026-08-25 |
| 0025 | Checkbox Plugin: First Domain-Contribution Plugin | Accepted | 2026-08-25 |
| 0026 | Alistigo Document Format: JSON-LD + schema.org Foundation and Package Standard | Accepted | 2026-08-29 |
| 0027 | Architecture as Code: Adopting CALM (Common Architecture Language Model) | Accepted | 2026-09-04 |
| 0028 | Package-First Repository Structure | Accepted | 2026-09-08 |
| 0029 | Alistigo.com Public Website via Astro Starlight | Accepted | 2026-09-09 |
| 0030 | PM2 Server Dev Mode | Accepted | 2026-09-14 |
