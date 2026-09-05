---
status: accepted
date: 2026-09-04
deciders: Mikael Labrut
---

# ADR 0027 — Architecture as Code: Adopting CALM (Common Architecture Language Model)

**Status:** Accepted
**Date:** 2026-09-04

## Context

Alistigo's architecture has been documented as a set of static Markdown files in `docs/` (`architecture.md`, `docs/platform/`, `docs/domain/`). These files are human-readable and colocated with the code, which is a good baseline. However, static Markdown has hard limits:

- **Not machine-readable**: no tooling can validate that the code respects the documented architecture
- **Not composable**: reusable architectural patterns must be copy-pasted rather than referenced
- **Not executable**: you cannot run a diagram through a constraint checker or extract topology for CI gates
- **Manual visualisation**: every diagram requires handcrafted ASCII art or Mermaid blocks with no synchronisation to actual package topology

Architecture as Code (AasC) addresses these gaps by treating architectural models as first-class versioned artefacts stored alongside the code. The key benefits of AasC are:

1. **Architecture = the source of truth**: code is expected to *conform* to the model, not the other way around
2. **CI guardrails**: CI can validate that implementations don't deviate from declared architecture
3. **Fitness functions**: quantitative metrics (coupling, layer violations, dependency rules) can be evaluated continuously against the codebase
4. **Toolable and AI-friendly**: structured files allow AI agents to reason about and propose architectural changes in a structured, schema-validated way
5. **Visualisation without manual effort**: diagrams are generated from the model, not drawn by hand

### Why Architecture as Code now

Alistigo is growing from a single-list-artifact to a multi-artifact platform. With AI agents writing code, architecture drift becomes a real risk without machine-enforceable constraints. We want:

- Explicit architectural boundaries that CI can enforce (architecture ≠ commentary)
- A workflow where new architectural elements are defined in CALM *before* implementation begins
- AI tools that understand the architecture model and can reason about compliance

### Alternatives considered

| Approach | Considered | Reason rejected |
|----------|------------|-----------------|
| **C4 + Structurizr DSL** | Yes | Proprietary DSL; hard to parse programmatically; no JSON schema; poor interoperability |
| **LikeC4** | Yes | Interesting but ecosystem is small; its own DSL again; less FINOS backing |
| **ArchiMate** | Yes | Too heavyweight, enterprise-oriented; XML-centric; not developer-friendly |
| **Mermaid only** | Yes | Good for rendering but not a structured model; no schema; can't validate against |
| **Plain JSON/YAML custom schema** | Yes | Would require building all tooling ourselves; reinventing the wheel |
| **CALM (chosen)** | — | See below |

### Why CALM

The **Common Architecture Language Model (CALM)** is an open-source specification maintained by [FINOS](https://calm.finos.org) (Fintech Open Source Foundation).

| Criterion | CALM |
|-----------|------|
| **Open standard** | Yes — FINOS-governed, Apache 2.0 |
| **JSON-first** | Yes — architecture is JSON with published JSON Schema |
| **Machine-readable** | Yes — schema validation, CLI tooling, MCP server for AI |
| **Composable** | Yes — pattern files (`*.pattern.json`) can be referenced from instantiation files |
| **Actively maintained** | Yes — regular releases, active FINOS working group (2024–2026) |
| **AI tooling** | Yes — `@finos/calm` MCP server for Claude/VS Code |
| **Visualisation** | Yes — calm-studio (interactive editor), calm-visualizer (Mermaid export for Markdown) |
| **CI integration** | Yes — `@finos/calm` CLI has `validate` and `generate` subcommands |
| **Ecosystem** | Emerging; early-adopter position is valuable |

The JSON format aligns with the repo's prior decisions (ADR 0026: JSON-LD for documents; data validation via JSON Schema). It also makes CALM files manipulable by any standard JSON tooling, including AI agents.

**Acknowledged early-adopter risk**: CALM is still maturing. Some tooling gaps may require workarounds. We accept this in exchange for riding the emerging open standard rather than locking into a proprietary DSL.

## Decision

### 1. CALM as the single Architecture as Code language

All architectural models for Alistigo are written in CALM-compliant JSON and stored under `architecture/` at the repo root. The `docs/architecture.md` and `docs/platform/` files remain as human-readable prose supplements but are not the source of truth for architecture validation.

Structure:
```
architecture/
├── README.md                         # Navigation and conventions
├── patterns/                         # Reusable CALM patterns ($.pattern.json)
│   ├── ddd-hexagonal.pattern.json    # DDD + hexagonal layers
│   └── event-sourcing.pattern.json   # Event sourcing + CQRS pattern
└── systems/                          # Instantiated architectures ($.arch.json)
    ├── alistigo-platform.arch.json   # Four-tier platform view
    ├── list-artifact.arch.json       # List artifact DDD internals
    └── artifact-runtime.arch.json    # Runtime/deployment view
```

### 2. Tooling — local installations, not global

All CALM tools are installed as project devDependencies or local workspace packages. No global installs.

| Tool | Package | Binary | Purpose |
|------|---------|--------|---------|
| **CALM CLI** | `@finos/calm-cli` (devDep at root) | `calm` | Validate, generate, lint CALM files from CLI |
| **CALM Schema** | `@finos/calm-schema` (devDep at root) | — | JSON Schema files for CALM format validation |
| **calm-server** | `@finos/calm-server` (devDep at root) | `calm-server` | Interactive CALM server/studio for browsing the architecture |

> **Note on MCP:** The CALM project does not yet publish a standalone MCP npm package (`@finos/calm-mcp`). The `calm` CLI binary (`@finos/calm-cli`) may expose MCP-compatible subcommands in a future release. When CALM MCP support is available, wire it into `.mcp.json` (for Claude Code) and `.vscode/mcp.json` (for VS Code). A placeholder `.vscode/mcp.json` is tracked in version control for this purpose.

### 3. Archify integration (future task)

[Archify](https://github.com/tt-a1i/archify) is a tool that consumes a typed JSON IR to produce interactive system-map HTML artifacts. It is a good fit for communicating architecture visually but does not support CALM files natively.

Integration is deferred to a future task. When the time comes:

1. Add Archify as a git submodule under `vendor/archify/`
2. Build a small CLI transformer (`cli/calm-to-archify/`) to convert CALM JSON → Archify's JSON IR
3. Wire the transformer into the build or a documentation script

This is not a blocker for using CALM or calm-studio.

### 4. Architecture-first workflow

New architectural elements (packages, external dependencies, cross-boundary relationships) are defined in CALM files *before* implementation begins. This is a process convention enforced initially by code review, and eventually by CI.

### 5. CI integration (future task)

A CI step will run `pnpm nx qa:arch-calm` (using `@finos/calm validate`) to reject PRs that contain invalid CALM files. Fitness functions comparing CALM-declared boundaries against actual `dependency-cruiser` boundaries are a follow-up task.

### 6. Markdown integration via calm-visualizer

CALM files can generate Mermaid diagrams via the CALM visualizer. `architecture/README.md` includes generated Mermaid blocks with instructions on how to refresh them. This keeps the prose docs in sync with the machine-readable model.

## Consequences

**Positive:**
- Architecture becomes machine-verifiable; drift is detected rather than accumulated silently
- AI agents (Claude Code) can reason about the architecture using the MCP server context
- Reusable patterns (DDD, event-sourcing) are modelled once and referenced, not duplicated
- Archify visualisations for presentations will be generated from the model once the integration task is complete (see §3)
- Sets up for fitness functions in CI — quantitative architecture compliance

**Negative / trade-offs:**
- CALM adds a new format to learn; team (currently solo) must maintain CALM files alongside code
- CALM is early-stage; some CLI features may be rough or change; we may need to contribute upstream fixes
- The `cli/calm-to-archify/` transformer is an additional custom tool to build and maintain
- CI integration (CALM validation gate) requires additional CI configuration

**Neutral:**
- Existing `docs/architecture.md` and `docs/platform/` remain as prose references; they are not deleted but are no longer the authoritative model
- `dependency-cruiser` (`qa:arch-check`) continues as the code-level enforcement layer; CALM operates at the conceptual level above it

## References

- [CALM specification](https://calm.finos.org)
- [CALM AI tools](https://calm.finos.org/working-with-calm/calm-ai-tools)
- [FINOS CALM GitHub](https://github.com/finos/CALM)
- [Architecture as Code — 2026 state of the art](https://www.catio.tech/blog/architecture-as-code) — primary inspiration for the AasC approach and fitness functions
- [ADR 0026](0026-alistigo-document-format-jsonld-schemaorg.md) — JSON-LD document format (same JSON-first philosophy)
- [ADR 0015](0015-agent-skills-standard.md) — Agent skills standard (same AI-tooling-first philosophy)
- [tt-a1i/archify](https://github.com/tt-a1i/archify) — future submodule for interactive system map generation (not yet added)
