---
name: Holos project memory
description: Persistent memory for the Holos monorepo — structure, preferences, and context
type: project
originSessionId: cf24885f-c895-4074-839a-72c712977fa3
---
# Holos Memory

Persistent patterns and preferences across Claude sessions. Keep under 200 lines.

## Repository Structure

| Directory | Purpose |
|-----------|---------|
| `apps/` | CLI tools, web servers, desktop apps |
| `packages/` | Publishable npm/GitHub libraries (`@mlabrut/*`) |
| `docs/` | Documentation only (no code) |
| `communication/` | Outward-facing content drafts (LinkedIn, dev.to) — see skill `communication` |
| `.agents/` | Agents skills, commands (source of truth), and this memory file |

## Tech Stack

- Package manager: **pnpm** with workspaces
- Build orchestration: **Nx** (`nx.json`, `project.json` per package)
- TypeScript runtime: **Bun** inside individual packages
- Linting/formatting: **Biome** (`biome.json` at root)
- Tool versions: **mise** (`.mise.toml` — node 22, bun, python 3.12, rust stable)

## Common Commands

```sh
mise run setup        # Bootstrap everything on a fresh machine
pnpm build            # Build all Nx projects
pnpm nx qa:lint             # Biome check across workspace
nx affected -t build  # Build only changed projects
bash scripts/new-package.sh <name>  # Scaffold a new package
```

Note: `.claude/skills` and `.claude/commands` are symlinks to `.agents/` — no install scripts needed.

## Claude Enhancement Tools

Four tools installed as git submodules in `vendor/`, skills symlinked into `.agents/skills/`:

| Tool | Skills |
|------|--------|
| **Caveman** (`vendor/caveman`) | `caveman`, `caveman-stats`, `caveman-commit`, `caveman-compress` |
| **Superpowers** (`vendor/superpowers`) | `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `using-git-worktrees`, `dispatching-parallel-agents`, `finishing-a-development-branch`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion` |
| **CCPM** (`vendor/ccpm`) | `ccpm` |
| **LinkedIn Skills** (`vendor/linkedin-skills`) | `linkedin-post-writer`, `linkedin-humanizer`, `linkedin-hook-extractor`, `linkedin-content-planner`, `linkedin-profile-optimizer`, `linkedin-employee-advocacy`, `linkedin-comment-drafter`, `linkedin-reply-handler`, `linkedin-engager-analytics`, `linkedin-thread-monitor` |

Caveman flag: `~/.claude/.caveman-active` (user-level, not repo-tracked — recreate with `/caveman` after fresh machine setup).
CCPM needs authenticated `gh` CLI — run `gh auth login` if CCPM commands fail.
PRDs: `.agents/prds/`. Epics: `.agents/epics/`. Both symlinked from `.claude/prds` and `.claude/epics`.
LinkedIn Skills: [vendoring pattern gap](feedback_vendor_symlink_gap.md) discovered 2026-07-03 — do it properly here (real submodule + real symlinks), unlike the other three. Its `linkedin-post-writer`/`linkedin-comment-drafter`/`linkedin-reply-handler` have a Publora auto-post path — never invoke it, draft only (see [[project_communication_linkedin_skills]]).

## ESPHome

- Configs: `embedded/esphome/<node-name>/config.yaml`
- Shared snippets: `embedded/esphome/common/`
- `embedded/esphome/secrets.yaml` is **gitignored** — copy from `secrets.example.yaml`

## Known Gotchas

- `embedded/esphome/secrets.yaml` is gitignored. Remind user if it's missing when they try to validate/flash.
- pnpm workspace packages reference each other via `workspace:*` in `package.json`, not relative paths.
- Each package needs a `project.json` for Nx to recognize it. `new-package.sh` handles this automatically.

## Preferences

- [TypeScript CLI convention](feedback_ts_cli.md) — use Clipanion + Ink for all TS CLI tools (skill: `ts-cli`)
- [Gherkin features package conventions](feedback_gherkin_features.md) — by-group folders (not by-milestone), Entities/Actors/Actions glossary, portable parts live in skill `gherkin-features`
- [Gherkin step style — tables for collections, implicit nouns](feedback_gherkin_collection_steps.md) — `Given a list:` + headerless table even for 1 row; `When I add "X"` not `When I add an element "X"`
- [Gherkin step language — domain terms, implicit setup](feedback_gherkin_step_language.md) — `reload the list` not `reload the iframe`; the open step is implicit unless the scenario tests opening itself
- [UI library selection — AI docs + linting are part of the bar](feedback_ui_library_criteria.md) — when evaluating libraries, always check llms.txt/MCP/agent skills (P2) and library-aware linting (P3)
- [Home-dir shell profile edits are blocked by a hook](feedback_home_dir_edits.md) — hand the user a paste-able snippet for `~/.profile`/`~/.bashrc`/etc., don't retry Edit/Write
- [Always branch before changes on main](feedback_branch_before_changes.md) — Task 0 in every plan must create a feature branch when starting from `main`

## Active Projects

- Initial monorepo scaffolding (completed 2026-03-13)
- [Career transition 2026](user_career_2026.md) — left Quatt, exploring employment vs freelancing in NL
- [Job research project](project_job_research.md) — tracking career transition tasks and decisions
- [Alistigo AI](project_alistigo_ai.md) — base list app + plugins (todo, checklist, etc.); M1 = base list, NOT todo list
- [Communication workflow](project_communication_linkedin_skills.md) — LinkedIn + dev.to only (no X, no auto-publish); backlog and drafts in `communication/`, skill `communication`, command `/communicate`; LinkedIn drafting hands off to vendored `linkedin-post-writer` (2026-07-03)

## References

- [RankMyAI](reference_rankmyai.md) — AI company directory, source of employment/freelance leads for the 2026 job search
- [IAmsterdam Startup Map (list 31126)](reference_startupmap_amsterdam.md) — curated Amsterdam startup list for 2026 job search prospecting
