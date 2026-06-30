# Skills Registry

Index of all skills in `.agents/skills/`. Three types:

| Type | Meaning |
|------|---------|
| `symlink` | Symlink into a `vendor/` git submodule — updated via `git submodule update --remote vendor/<name>` |
| `local-copy` | Copied from an external source — update manually; source URL is in the SKILL.md header |
| `authored` | Written in-repo from scratch — no external source |

---

## Triggers Quick Reference

What to say or do to activate each skill. Claude should invoke the skill before responding whenever any of these signals appear.

| Skill | Keywords | Example Trigger |
|-------|----------|----------------|
| `using-superpowers` | session start, skill-first | *(fires automatically at session start)* |
| `writing-plans` | plan, implement, multi-step, before coding | "Let's implement the auth flow" |
| `executing-plans` | execute plan, follow the plan, implement plan | "Let's execute the plan we wrote" |
| `test-driven-development` | TDD, failing test, feature, implement | "Add the user login feature" |
| `systematic-debugging` | bug, broken, failing test, unexpected, error | "The auth test is failing and I don't know why" |
| `dispatching-parallel-agents` | parallel, independent, simultaneously | "Do A and B at the same time" |
| `subagent-driven-development` | subagent, tasks, independent, current session | "Execute this plan across multiple tasks" |
| `using-git-worktrees` | worktree, isolate, parallel branch | "Work on this feature in a worktree" |
| `finishing-a-development-branch` | done, merge, PR, ship, complete | "I'm done with this feature, how do I integrate it?" |
| `requesting-code-review` | review, before merging, verify | "I'm done implementing — can you review?" |
| `receiving-code-review` | review feedback, reviewer said, PR comment | "The reviewer flagged this — how should I address it?" |
| `verification-before-completion` | done, finished, verify, check | "I think this task is complete" |
| `ccpm` | PRD, epic, issue, standup, status, ship | "Let's plan the new notifications feature" |
| `domain-driven-design` | model the domain, DDD, aggregate, bounded context | "Model the domain for the checkout flow" |
| `architecture-decision-records` | ADR, decision, choose between, architecture, approach | "Should we use Zustand or Jotai for state management?" |
| `gherkin-features` | Gherkin, BDD, feature file, scenario, step definitions | "Add a feature file for the login flow" |
| `git-safety` | push, force push, reset, clean, destructive git | `git push --force`, `git reset --hard` |
| `lingui-best-practices` | Lingui, i18n, Trans, useLingui, .po, extract | "Add translations to this component" |
| `lingui-enhanced-message-context` | message context, translation quality, Lingui context | "Improve the translation context for these strings" |
| `lingui-migrate-i18next-to-lingui` | migrate, i18next, react-i18next, Lingui | "Migrate from i18next to Lingui" |
| `lingui-swc-plugin-compatibility` | Lingui SWC, plugin error, Next.js Lingui | "Lingui SWC plugin fails with Next.js" |
| `nx-git-workflow` | Nx, affected, main branch, release, monorepo git | "We're on main, what should I do?" |
| `react-component` | React component, component pattern, JSX | "Create a new UserCard component" |
| `shadcn` | shadcn, shadcn/ui, component, Radix | "Add a shadcn Button to this page" |
| `ts-cli` | CLI, Clipanion, Ink, terminal, command | "Build a CLI tool for X" |
| `fallow` | dead code, unused, circular dep, clean up, health | "Find unused exports in the codebase" |
| `caveman` | /caveman, compress, token-efficient | `/caveman` |
| `caveman-commit` | commit message, caveman commit | "Write a commit message for this diff" *(in caveman mode)* |
| `caveman-compress` | compress memory, compress notes | "Compress this memory file" |
| `caveman-stats` | /caveman-stats, compression stats | `/caveman-stats` |

---

## Vendor Submodules (symlinks)

### vendor/caveman — https://github.com/JuliusBrussee/caveman

Token-compression methodology: terse caveman-style output at configurable intensity levels.

| Skill | Purpose |
|-------|---------|
| `caveman` | Toggle caveman mode, set intensity (lite/full/ultra/wenyan) |
| `caveman-commit` | Write compressed git commit messages |
| `caveman-compress` | Compress a memory/notes file in-place |
| `caveman-stats` | Report compression stats for the session |

### vendor/superpowers — https://github.com/obra/superpowers

Structured development methodology: plan before code, TDD, parallel agents, verify before done.

| Skill | Purpose |
|-------|---------|
| `using-superpowers` | Session start — establishes skill-first workflow |
| `writing-plans` | Write an implementation plan before touching code |
| `executing-plans` | Execute a written plan with inline checkpoints |
| `test-driven-development` | TDD workflow — failing test first, then implementation |
| `systematic-debugging` | Structured bug investigation before proposing fixes |
| `dispatching-parallel-agents` | Split independent tasks across parallel subagents |
| `subagent-driven-development` | Fresh subagent per task with two-stage review |
| `using-git-worktrees` | Isolate feature work in a git worktree |
| `finishing-a-development-branch` | Structured options for merge, PR, or cleanup |
| `requesting-code-review` | Pre-merge verification checklist |
| `receiving-code-review` | How to act on review feedback |
| `verification-before-completion` | Final checks before declaring a task done |

### vendor/ccpm — https://github.com/automazeio/ccpm

Spec-driven project management: PRD → Epic → GitHub Issues → parallel agents → shipped code.

| Skill | Purpose |
|-------|---------|
| `ccpm` | Full CCPM workflow — plan, structure, sync, execute, track |

---

## Local Copies (copied from external source)

| Skill | Source | Copied | Reason |
|-------|--------|--------|--------|
| `domain-driven-design` | https://github.com/booklib-ai/booklib/blob/main/skills/domain-driven-design/SKILL.md | 2026-05-13 | Copied to freely extend with CCPM integration (DDD modeling step after PRD) and project-specific conventions |
| `architecture-decision-records` | https://github.com/affaan-m/everything-claude-code/blob/main/skills/architecture-decision-records/SKILL.md | 2026-06-10 | Adapted to Holos ADR format (YAML frontmatter, comparison tables, dual location rule: `docs/adrs/` for repo-wide, `projects/<app>/adrs/` for app-specific) |

---

## Authored In-Repo

Skills written from scratch for this monorepo's specific tooling and conventions.

| Skill | Purpose |
|-------|---------|
| `gherkin-features` | Gherkin feature file conventions — by-group folders, Entities/Actors/Actions glossary, portable step patterns |
| `git-safety` | Git safety rules — never force-push, never skip hooks, destructive op checklist |
| `lingui-best-practices` | Lingui i18n in React/TS — Trans, useLingui, Plural, .po catalogs, extraction |
| `lingui-enhanced-message-context` | Enrich Lingui message context from codebase for better translation quality |
| `lingui-migrate-i18next-to-lingui` | Migrate i18next/react-i18next projects to Lingui |
| `lingui-swc-plugin-compatibility` | Diagnose and fix Lingui SWC plugin errors with Next.js / Rspack |
| `nx-git-workflow` | Nx monorepo git workflow — affected builds, task caching, branch conventions |
| `react-component` | React component patterns for this repo |
| `shadcn` | shadcn/ui component management — add, fix, style, compose |
| `ts-cli` | TypeScript CLI tools using Clipanion + Ink |
