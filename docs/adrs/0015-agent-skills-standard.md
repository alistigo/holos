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

3. **Skill trigger quality is verified with eval queries.** Each publishable skill package contains an `eval_queries.json` at its root — a labelled set of ≥30 user prompts (≥15 `should_trigger: true`, ≥15 `should_trigger: false`) with a `split` field marking each entry as `"train"` (~60%) or `"validation"` (~40%). The `cli/agent-skill-tester` CLI runs these queries through an agent (default: `claude`) and computes per-query trigger rates over multiple runs (default: 3). A query passes when its trigger rate is above the threshold (default: 0.5) for should-trigger queries, or below it for should-not-trigger queries. Description changes must pass both splits before merging. The optimization methodology is documented at [agentskills.io/skill-creation/optimizing-descriptions](https://agentskills.io/skill-creation/optimizing-descriptions).

## Rationale

| Criterion | `ai/` (old) | `.agents/` (new) |
|-----------|------------|-----------------|
| Follows agentskills.io standard | ❌ Custom path, requires symlinks | ✅ Canonical default path |
| Cross-tool portability | ❌ Only Claude Code (via symlink) | ✅ Any compliant agent discovers it without config |
| Skills as npm packages | ❌ Not structured for publishing | ✅ agentskills.io structure = valid npm package root |
| Git history coherence | — | ✅ `git mv` preserves history |
| Trigger quality verifiable | ❌ Ad-hoc manual testing | ✅ Eval queries + trigger rate CLI |

The decisive factor for the directory rename is cross-tool portability. With `.agents/skills/` as the path, any agentskills.io-compatible tool (current or future) discovers the skills without per-tool configuration. The `.claude/skills` symlink is retained for Claude Code backward compatibility.

For publishable skills, the agentskills.io layout (`SKILL.md` at root, optional `scripts/`, `references/`, `assets/`) already matches what an npm package root needs. Adding `package.json` and `project.json` to such a directory is all that's required to make it a publishable Nx package.

The `description` field in `SKILL.md` carries the entire burden of triggering — agents only load skill metadata at startup and use it to decide whether to invoke the full skill. A poorly-worded description means the skill won't trigger when it should (or will trigger when it shouldn't). Systematic eval testing is the same discipline applied to skill descriptions as unit testing applied to code: catch regressions, measure coverage, and iterate with confidence.

## Consequences

**Positive:**
- Skills are portable across all agentskills.io-compatible tools without additional configuration
- Published skills get versioned npm releases following the existing repo release strategy (ADR 0013)
- The directory rename removes the conceptual mismatch between `ai/` (a very broad label) and its actual content (agent workflow context)
- Future skills developed as npm packages are installable via `npm install <skill-name>` by any consumer
- Skill trigger quality is measurable and improvable: eval queries make description regressions visible before they ship

**Negative / tradeoffs accepted:**
- Existing documentation, bookmarks, and muscle memory referencing `ai/` must be updated — one-time cost
- The `.claude/skills` symlink is a thin compatibility shim that remains until Claude Code makes `.agents/skills/` a first-class discovery path (tracked upstream)
- npm skill packages require a build/publish step beyond just editing a markdown file
- Running a full eval set costs ~60 agent invocations (20 queries × 3 runs); this is intentional — trigger testing requires live agent calls
- CI automation of trigger tests requires `ANTHROPIC_API_KEY` (Anthropic API billing account). A claude.ai subscription does not expose programmatic API access usable in GitHub Actions. CI integration is **deferred** until API billing is enabled; run `agent-skill-tester validate-triggers` manually on dev machines in the meantime

## Alternatives considered

- **Keep `ai/` with symlinks** — rejected: symlinks are a workaround, not a design. They break when the repo is cloned without the right setup, and they add friction for any non-Claude Code agent.
- **Use a different non-standard directory (e.g. `skills/`)** — rejected: `.agents/` is the spec default and the name signals intent clearly; `skills/` alone would be ambiguous about what else might live there.
