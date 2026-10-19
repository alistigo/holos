---
status: accepted
date: 2026-10-17
deciders: Mikael Labrut
---

# ADR 0031 — Artifact Architecture Conformance CLI

## Status

Accepted — 2026-10-17

## Context

ADR 0027 introduced CALM (Common Architecture Language Model) as architecture-as-code for the platform. CALM files describe the intended module composition of every Alistigo artifact: which packages must exist, what DDD layer each belongs to, and which dependency directions are allowed between them.

Until now, CALM was enforced in two partial ways:
- `pnpm calm validate` — validates that CALM files are internally consistent (JSON Schema conformance and pattern checks)
- `pnpm qa:arch-check` (dependency-cruiser) — prevents circular deps and a few global anti-patterns

Neither checked that the code structure actually conforms to what the CALM architecture declares. A developer could:
- Add a new artifact without creating the required packages
- Create a package with the wrong name
- Add a forbidden dependency between DDD layers
- Omit required `package.json` fields
- Skip the `alistigo.type` metadata field

These gaps meant the CALM file was primarily documentation, not an enforceable contract.

## Decision

We introduce `artifact-arch-check`, a CLI tool at `cli/artifact-arch-check/`. It treats the CALM architecture file as the authoritative source of truth and runs a series of structural checks against the workspace packages.

**Two commands:**

`generate <name>` — creates a concrete artifact CALM file from the generic template by substituting four artifact-specific slot nodes (`domain`, `document`, `ui`, `skill`) with the artifact's package names. This ensures every new artifact is grounded in the architecture from day one.

`check <name>` — runs four checks against a CALM file and the workspace packages:

1. **module-existence**: every CALM node with a `core-npm-package` must correspond to an existing `packages/` directory
2. **boundaries**: a package's `@alistigo/*` dependencies must be a subset of the nodes it points to via CALM `connects` relationships
3. **package-conformance**: every package must have the required `package.json` fields from the project template
4. **alistigo-metadata**: every package must have an `"alistigo": { "type": "..." }` field whose value matches the CALM node's DDD layer

Each check is a standalone `CheckDefinition` that can be run individually via `--only <check-id>`. The boundary rules are not hardcoded — they are derived directly from the CALM file's `connects` relationships at runtime, so they stay in sync with architectural evolution.

**New `"alistigo"` field in `package.json`:**

```json
{
  "alistigo": {
    "type": "domain"
  }
}
```

Valid types: `"domain"`, `"application"`, `"presentation"`, `"infrastructure"`, `"plugin"`, `"skill"`. This field allows tooling to understand a package's architectural role without parsing CALM files.

**CLI conventions:** Clipanion + Ink, matching the pattern of `cli/document-validator` and `cli/nx-npm-publications`. Error output includes a `Fix:` line and a `Docs:` reference on every issue — designed to be readable by both humans and AI agents.

**JSON output mode** (`--json`) emits structured output for CI scripts and automated pipelines.

## Consequences

**Positive:**
- CALM becomes an enforceable contract, not just documentation
- New artifact authors get clear, actionable error messages when their package structure diverges from the architecture
- Boundary rules stay in sync with the CALM file — no separate rule maintenance
- AI agents can consume `--json` output to understand architectural issues and suggest fixes

**Neutral:**
- Every existing artifact package that introduces this tooling will need the `"alistigo"` field added to its `package.json` — a one-time migration
- `scripts/new-package.sh` is updated to include `"alistigo": { "type": "TODO" }` in the template, prompting new package authors to set the correct type

**Trade-offs:**
- The boundaries check reads all `@alistigo/*` deps from all dependency keys (dependencies + devDependencies + peerDependencies). This is intentionally strict — architectural boundaries should hold regardless of whether a dependency is runtime or development.
- `skill` packages are exempted from the boundaries check since they have no runtime code dependencies by architectural decree (they are documentation assets).
- Shared infrastructure nodes (`artifact-core`, `plugin-bus`, etc.) are validated like any other package. This means if `@alistigo/artifact-core` gains a forbidden dependency on a list-specific package, the check will catch it.

## References

- ADR 0027 — Architecture as Code (CALM): context for why CALM was adopted
- `packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json` — canonical template
- `cli/artifact-arch-check/docs/README.md` — tool usage and check reference
