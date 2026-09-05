---
name: architecture-as-code
status: in-progress
created: 2026-09-04T00:00:00Z
updated: 2026-09-04T00:00:00Z
progress: 60%
github: https://github.com/alistigo/holos/issues/116
---

# Epic: Architecture as Code — CALM

## Overview

Move Alistigo's architecture from static Markdown files (`docs/architecture.md`, `docs/platform/`) to executable Architecture as Code using CALM (Common Architecture Language Model, FINOS open standard). Install tooling, write architecture files, wire AI tools, set up CI validation gate.

**Why now:** As Alistigo grows into a multi-artifact platform with AI agents writing code, architecture drift without machine-enforceable constraints is a real risk. AasC turns architecture into a CI gate and gives AI tools structured architectural context.

## Architecture Decisions

- **ADR 0027**: Architecture as Code — CALM adoption (replaces static Markdown as source of truth)
  - CALM chosen over C4/Structurizr/LikeC4/ArchiMate: JSON-first, FINOS-backed, MCP tooling for AI, open schema

## Key Design Choices

- **CALM JSON files** under `architecture/` — patterns (reusable) + systems (concrete)
- **No global installs** — `@finos/calm`, `@finos/calm-mcp`, `@finos/calm-studio` all as root devDependencies
- **CALM MCP server** wired into `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code)
- **`qa:arch-calm`** script added to `package.json` and CI workflow
- **`cli/calm-to-archify/`** — future transformer for Archify presentations (deferred to Issue #120)
- **`docs/architecture.md`** remains as prose supplement; `architecture/` is the authoritative source

## Task Map

| # | GitHub | Task | Status |
|---|--------|------|--------|
| 1 | #116 | ADR 0027: CALM adoption decision record | done |
| 2 | #117 | Create CALM architecture files (platform, list artifact DDD, toolchain) | done |
| 3 | #118 | Install CALM tooling + configure MCP for Claude Code + VS Code | done |
| 4 | #119 | Add qa:arch-calm to GitHub Actions CI | todo |
| 5 | #120 | Scaffold cli/calm-to-archify (CALM → Archify IR) | deferred |

## File Structure Established

```
architecture/
├── README.md
├── patterns/
│   ├── ddd-hexagonal.pattern.json
│   └── event-sourcing-cqrs.pattern.json
└── systems/
    ├── alistigo-platform.arch.json
    ├── list-artifact-ddd.arch.json
    └── monorepo-toolchain.arch.json
```

## Package Names (verify at install time)

CALM is actively evolving. Before running `pnpm install`, verify these npm package names exist:
- `@finos/calm` — CLI
- `@finos/calm-mcp` — MCP server
- `@finos/calm-studio` — visual editor

If package names differ, update `package.json` devDependencies accordingly.
