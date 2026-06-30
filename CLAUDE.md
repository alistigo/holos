# CLAUDE.md — Holos

## What This Repo Is

Holos is the main repository (monorepo) of alistigo. It contains TypeScript apps and libraries, Docker containers, project documentation and eveyrithing related ot alistigo.

## Directory Map
| Directory | Purpose |
|-----------|---------|
| `apps/` | Runnable applications — CLI tools, web servers, desktop apps |
| `packages/` | Reusable libraries, publishable to npm / GitHub Packages |
| `docs/` | Project documentation — plans, goals, architecture docs (no code) |
| `.agents/` | Agents AI skills, commands (source of truth), and persistent memory |

## Package Manager & Runtime

| Tool | Role |
|------|------|
| **pnpm** | Package manager and workspace orchestrator |
| **Nx** | Build pipeline, task caching, code generation |
| **Bun** | TypeScript runtime inside individual apps/packages |
| **Biome** | Linting and formatting (replaces ESLint + Prettier) |
| **mise** | Tool version manager — pins node, bun, python, rust |

## Common Commands

```sh
pnpm build              # Build all Nx projects
pnpm build:typecheck    # Type-check all projects
pnpm test               # Run all tests

nx run <project>:build  # Build a single project
nx affected -t build    # Build only what changed vs main
```

All QA tools follow the `qa:*` prefix convention:

```sh
pnpm qa                 # Run all qa:* checks in parallel (via Nx)
pnpm qa:lint            # Biome lint across the workspace
pnpm qa:arch-check      # Architectural linting (dependency-cruiser) — see docs/arch-check.md
pnpm qa:dead-code       # Fallow: unused files, exports, dead code (full repo scan)
pnpm qa:audit           # Fallow: fast changed-file risk gate (pre-push / CI)
```

## TypeScript Standards

- All packages extend `tsconfig.base.json` at the repo root
- Strict mode is ON — `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- Use `workspace:*` protocol for local package references in `package.json`
- Each package has its own `tsconfig.json` extending `../../tsconfig.base.json`
- No `any` without a justification comment

## Adding a New Package

```sh
bash scripts/new-package.sh <name>
# Creates packages/<name>/ with src/index.ts, package.json, tsconfig.json, project.json
```

Or use Nx generators: `nx generate @nx/js:library --name=<name> --directory=packages/<name>`

## Nx Task Convention

**`project.json` is the single source of truth for all Nx tasks.**

- All `build`, `typecheck`, `test`, `lint`, `clean`, `dev` targets live in `project.json` only
- `package.json` scripts are reserved for tasks that Nx does not orchestrate (rare one-off scripts with no Nx equivalent)
- The root `package.json` is the exception: it uses `nx run-many` to delegate, which is correct
- Running tasks via `nx run <project>:<target>` enables caching, `affected` analysis, and `dependsOn` wiring
- Running the same command as a `package.json` script bypasses all of that

**Anti-pattern to avoid:**

```jsonc
// package.json — DON'T duplicate what's already in project.json
{ "scripts": { "typecheck": "tsc --noEmit" } }

// project.json — source of truth
{ "targets": { "typecheck": { "command": "tsc --noEmit" } } }
```

When `new-package.sh` or `nx generate` scaffolds a new package, only `project.json` gets task definitions. The generated `package.json` has no `scripts` block (or only scripts with no Nx equivalent, such as a one-off `start` for direct invocation).

## AI / Claude

| Path | Purpose |
|------|---------|
| `.agents/memory/MEMORY.md` | Persistent memory across Claude sessions (git-tracked) |
| `.agents/skills/` | Skill definitions (source of truth) |
| `.agents/commands/` | Slash command definitions (source of truth) |
| `.agents/hooks/` | Hook scripts (session-start, etc.) |
| `.agents/context/` | Static context documents |
| `.claude/skills` | Symlink → `.agents/skills` |
| `.claude/commands` | Symlink → `.agents/commands` |
| `.claude/settings.json` | Permissions, hooks config |

`.claude/skills` and `.claude/commands` are **symlinks** to `.agents/` — no install scripts needed. Edit files in `.agents/` and they take effect immediately.

When creating a new skill, add it to `.agents/skills/<skill-name>/SKILL.md`.
When creating a new command, add it to `.agents/commands/<command-name>/<command-name>.md`.

## Claude Enhancement Tools

Three tools live as git submodules in `vendor/` and are symlinked into `.agents/skills/`:

| Tool | Purpose | Source |
|------|---------|--------|
| **Caveman** | Token compression — ~65% output token reduction via terse responses | `vendor/caveman` |
| **Superpowers** | Structured dev methodology — Design→Plan→Execute→Test→Complete | `vendor/superpowers` |
| **CCPM** | Spec-driven project management — PRD → Epic → GitHub Issues → Code | `vendor/ccpm` |

### Caveman

Caveman compresses Claude's output to save tokens. Toggle it with `/caveman` in a session. The user-level flag lives at `~/.claude/.caveman-active` (not repo-tracked — re-create with `/caveman` on a fresh machine). Stats: `/caveman-stats`. Compress a memory file: `/caveman-compress`.

### Superpowers

Superpowers injects a structured workflow at session start via `.agents/hooks/superpowers-session-start.sh`. It enforces: always write a plan before touching code, use TDD, dispatch parallel agents for independent tasks, and verify before declaring completion. Skills auto-trigger on context — no explicit invocation needed.

### CCPM

CCPM manages the full delivery lifecycle. PRDs go in `.agents/prds/`, epics in `.agents/epics/`, and GitHub Issues are the source of truth for task tracking.

**Workflow:**
1. "I want to build X" → Claude writes a PRD in `.agents/prds/`
2. Approve PRD → Claude creates an epic with numbered tasks in `.agents/epics/`
3. Approve epic → Claude creates GitHub Issues via `gh issue create`
4. Work proceeds issue-by-issue; each issue commit references `Issue #N`
5. `/standup`, `/status`, `/next` for progress tracking

**Every project in `projects/` should have a corresponding CCPM epic and GitHub issues.**

### Updating Tools

```sh
git submodule update --remote vendor/caveman
git submodule update --remote vendor/superpowers
git submodule update --remote vendor/ccpm
git add vendor/ && git commit -m "chore(vendor): update claude tool submodules"
```

## Git Conventions

- Branch naming: `feat/<description>`, `fix/<description>`, `chore/<description>`, `docs/<description>`
- Commit style: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)
- Main branch: `main`
- Do not force-push to `main`
- Whenever adding a new project, app, or package — always follow the full git workflow (branch → scaffold → commit → draft PR) without being asked


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
