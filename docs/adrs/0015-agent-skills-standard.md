---
status: accepted
date: 2026-06-30
deciders: Mikael Labrut
---

# ADR 0015 — Agent Skills Standard (agentskills.io)

**Status:** Accepted  
**Date:** 2026-06-30

## Context

As the agent tooling ecosystem matured, an open format emerged for packaging reusable agent capabilities: [Agent Skills](https://agentskills.io). The format was originally developed by Anthropic, released as an open standard, and has since been adopted by 30+ agent products — including Claude Code, GitHub Copilot, Gemini CLI, VS Code, OpenAI Codex, Cursor, Kiro, and others.

The specification ([agentskills.io/specification](https://agentskills.io/specification)) defines:

- A skill is a directory containing a `SKILL.md` file (plus optional `scripts/`, `references/`, `assets/` subdirectories)
- `SKILL.md` requires a `name` and `description` frontmatter; both fields drive _progressive disclosure_ — agents load only metadata at startup and full instructions on activation
- The canonical default directory is `.agents/skills/`

This repo previously stored all agent context in `ai/` with a `.claude/skills` symlink workaround to bridge the gap. That workaround is unnecessary once the standard path is used.

A secondary concern: skills with broad applicability (e.g. the Alistigo widget embedding skill) should be distributable to external consumers, not just available in this repo. The agentskills.io directory structure maps cleanly onto an npm package root, enabling versioned skill releases.

## Decision

1. **Rename `ai/` → `.agents/`** so in-repo skills live at `.agents/skills/<name>/SKILL.md`, the spec's canonical default path. All subdirectories move with it: `commands/`, `hooks/`, `memory/`, `epics/`, `prds/`, `context/`.

2. **Publishable skills are packaged as npm packages** (one package per skill), following the agentskills.io directory structure with `SKILL.md` at the package root. Package naming convention: `<product>-skill` (e.g. `alistigo-artifact-list-skill`, `artifact-manager-skill`). Migration of existing skills into packages is deferred to a follow-up refactor.

## Rationale

| Criterion | `ai/` (old) | `.agents/` (new) |
|-----------|------------|-----------------|
| Follows agentskills.io standard | ❌ Custom path, requires symlinks | ✅ Canonical default path |
| Cross-tool portability | ❌ Only Claude Code (via symlink) | ✅ Any compliant agent discovers it without config |
| Skills as npm packages | ❌ Not structured for publishing | ✅ agentskills.io structure = valid npm package root |
| Git history coherence | — | ✅ `git mv` preserves history |

The decisive factor is cross-tool portability. With `.agents/skills/` as the path, any agentskills.io-compatible tool (current or future) discovers the skills without per-tool configuration. The `.claude/skills` symlink is retained for Claude Code backward compatibility.

For publishable skills, the agentskills.io layout (`SKILL.md` at root, optional `scripts/`, `references/`, `assets/`) already matches what an npm package root needs. Adding `package.json` and `project.json` to such a directory is all that's required to make it a publishable Nx package.

## Consequences

**Positive:**
- Skills are portable across all agentskills.io-compatible tools without additional configuration
- Published skills get versioned npm releases following the existing repo release strategy (ADR 0013)
- The directory rename removes the conceptual mismatch between `ai/` (a very broad label) and its actual content (agent workflow context)
- Future skills developed as npm packages are installable via `npm install <skill-name>` by any consumer

**Negative / tradeoffs accepted:**
- Existing documentation, bookmarks, and muscle memory referencing `ai/` must be updated — one-time cost
- The `.claude/skills` symlink is a thin compatibility shim that remains until Claude Code makes `.agents/skills/` a first-class discovery path (tracked upstream)
- npm skill packages require a build/publish step beyond just editing a markdown file

## Alternatives considered

- **Keep `ai/` with symlinks** — rejected: symlinks are a workaround, not a design. They break when the repo is cloned without the right setup, and they add friction for any non-Claude Code agent.
- **Use a different non-standard directory (e.g. `skills/`)** — rejected: `.agents/` is the spec default and the name signals intent clearly; `skills/` alone would be ambiguous about what else might live there.
