# Architecture Decision Records

This directory contains architectural decisions for the Holos monorepo — both repo-wide choices (tooling, process, deployment, infrastructure) and Alistigo AI project decisions. An ADR explains *why* a decision was made, what alternatives were considered, and what trade-offs were accepted.

| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](0001-ui-library.md) | UI Library & i18n Stack | Accepted | 2026-05-02 |
| [0002](0002-branch-protection.md) | Branch Protection & Security | Accepted | 2026-06-10 |
| [0003](0003-npm-trusted-publisher.md) | npm Publishing via OIDC Trusted Publisher | Superseded | 2026-06-10 |
| [0004](0004-artifact-delivery-strategy.md) | Artifact Delivery Strategy — npm/jsDelivr over GitHub Pages | Accepted | 2026-06-02 |
| [0005](0005-claude-artifact-storage.md) | Storage in Claude Artifact Context — window.storage over localStorage | Accepted | 2026-06-02 |
| [0006](0006-github-pages-scope.md) | GitHub Pages Scope — Testing/Demos Only | Accepted | 2026-06-02 |
| [0007](0007-logging-library.md) | Logging Library | Accepted | 2026-06-03 |
| [0008](0008-error-monitoring.md) | Error Monitoring | Accepted | 2026-06-09 |
| [0009](0009-browser-debug-api.md) | Browser Debug API | Accepted | 2026-06-09 |
| [0010](0010-product-analytics.md) | Product Analytics | Accepted | 2026-06-09 |
| [0011](0011-jsdelivr-versioning-strategy.md) | jsDelivr CDN Versioning Strategy | Accepted | 2026-06-12 |
| [0012](0012-component-documentation.md) | Component Documentation Standard | Accepted | 2026-06-12 |
| [0013](0013-release-strategy.md) | Release Strategy | Accepted | 2026-06-10 |
| [0014](0014-npm-token-auth.md) | npm Publishing via NPM_TOKEN | Accepted | 2026-06-11 |
| [0015](0015-agent-skills-standard.md) | Agent Skills Standard (agentskills.io) | Accepted | 2026-06-30 |
| [0016](0016-artifact-plugin-system.md) | Composable Artifact Plugin System | Accepted | 2026-07-09 |
| [0017](0017-storage-plugin-system.md) | Storage Plugin System | Accepted | 2026-07-24 |
| [0018](0018-alistigo-platform.md) | Alistigo as a Platform for AI Artifacts | Accepted | 2026-07-27 |
| [0019](0019-claude-artifact-draft-vs-published.md) | Claude Artifact Lifecycle — Draft vs. Published Storage Behavior | Accepted | 2026-08-06 |
| [0020](0020-artifact-fetch-scope.md) | Claude Artifact `window.fetch` is Anthropic-API-Only | Accepted | 2026-08-09 |
| [0021](0021-ai-input-action-markdown.md) | AI Input Action — Markdown as Document Source Format | Accepted | 2026-08-15 |
| [0022](0022-artifact-user-plugin.md) | Artifact User Plugin: Device-Scoped Identity | Accepted | 2026-08-20 |
| [0023](0023-entity-ids-typeid.md) | Entity IDs: TypeID as the Preferred Format | Accepted | 2026-08-20 |
| [0024](0024-shared-list-view-actor-registry.md) | Shared-List View: Actor Registry in Document | Accepted | 2026-08-25 |
| [0025](0025-checkbox-plugin-domain-contribution.md) | Checkbox Plugin: First Domain-Contribution Plugin | Accepted | 2026-08-25 |
| [0026](0026-alistigo-document-format-jsonld-schemaorg.md) | Alistigo Document Format: JSON-LD + schema.org Foundation and Package Standard | Accepted | 2026-08-29 |
