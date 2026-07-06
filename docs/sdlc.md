# AI-Augmented SDLC in Europa

## Philosophy

Europa is a personal sandbox monorepo. Not everything in it becomes software — and that's intentional. Ideas incubate in `ideas/`, research accumulates in `research/` logs, and only the ones worth building get promoted into the full development pipeline.

The lifecycle has two key transitions:

1. **Idea → Project** — A validated idea gains requirements (PRD), architecture, and tracked work items.
2. **Project → Production** — Working software that has users, dependencies, or infrastructure that matters when it breaks.

Between those transitions, and throughout the maintenance cycle, AI participates at every step — but never without a human review gate at strategic moments. The goal is _AI does the work, human holds the wheel_.

---

## Lifecycle Overview

```
ideas/            Ideation & research — no structure yet
    ↓ (human: decide to build)
.agents/prds/     Specification — CCPM writes the PRD
    ↓ (human: PRD approval)
.agents/epics/    Decomposition — CCPM creates Epic + GitHub Issues
    ↓ (human: epic approval + plan approval)
Development       Parallel agents, TDD, quality gates
    ↓ (human: code review + PR merge)
Production        apps/ · packages/ · agents/ · embedded/
    ↓
Maintenance       Issue-driven evolution, Fallow-guided cleanup, deprecation
```

---

## Stage 0: Environment Bootstrap

Every Claude Code session starts with two `SessionStart` hooks that run automatically:

| Hook | Script | What it does |
|------|--------|--------------|
| Tool environment | `.agents/hooks/session-start.sh` | Activates `mise`, exports tool paths (bun, pnpm, node) into Claude's shell. Also reads `~/.claude/.caveman-active` for token-compression mode. |
| Workflow discipline | `.agents/hooks/superpowers-session-start.sh` | Bootstraps the Superpowers framework, which enforces: always write a plan before code, use TDD, dispatch parallel agents for independent tasks, verify before declaring done. |

These hooks mean the structured workflow is part of the environment — not a convention that can be forgotten.

**Skills loaded at session start:** `using-superpowers` governs skill dispatch (if there's a 1% chance a skill applies, invoke it before responding).

---

## Stage 1: Ideation

**Directory:** `ideas/<idea-name>/`

Each idea folder contains: `createdAt`, current `status`, and a `research/` log of findings. No structure beyond that — this stage is deliberately freeform.

**AI role at this stage:** None mandated. Claude can answer research questions or help draft the research log, but there are no enforced workflows.

**Human step → promote:** The human decides when an idea is validated enough to deserve a PRD. That decision is never automated.

---

## Stage 2: Specification (PRD)

**Trigger:** Human initiates. "I want to build X."

**Directory:** `.agents/prds/<project>-<milestone>.md`

**AI touchpoint:** Skill `ccpm`

The `ccpm` (spec-driven delivery) skill drives PRD authoring:
- Captures the "what" and "why" — not implementation details
- Scopes milestones explicitly and realistically
- Produces a structured PRD in `.agents/prds/`

**Human review gate:** The human reads the PRD and approves or redirects. Nothing moves to Stage 3 without explicit approval.

---

## Stage 3: Architecture & Planning

Once the PRD is approved, three parallel preparation threads run:

| Skill | What it produces | Where it lives |
|-------|-----------------|----------------|
| `ccpm` | Epic with numbered tasks + GitHub Issues | `.agents/epics/`, GitHub |
| `domain-driven-design` | Bounded contexts, entities, aggregates, invariants | `domain-model.md` inside the project |
| `writing-plans` | Bite-sized implementation plan: TDD steps, exact file paths, expected command output | `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` |

All planning happens in **Plan Mode**. Claude cannot touch code until a plan is written, reviewed, and the human exits Plan Mode (approves the approach).

**Setup:** Skill `using-git-worktrees` creates an isolated git worktree before execution begins, so the main workspace stays clean.

**Human review gate:** Epic approval (task breakdown correct?) then Plan Mode exit (implementation approach correct?).

---

## Stage 4: Development

GitHub Issues — created by CCPM from the approved epic — drive work. Each issue is one atomic unit of deliverable software. Issues are linked in every commit message.

### Agent Orchestration

Two skills enable structured parallel AI development:

| Skill | Pattern |
|-------|---------|
| `subagent-driven-development` | **Orchestrator pattern.** A fresh subagent handles each task. The orchestrator reviews the subagent's output through two lenses (spec adherence, then code quality) before the next task starts. |
| `dispatching-parallel-agents` | Independent tasks — no shared state, no sequential dependencies — are dispatched to concurrent agents in a single message. |

The orchestrator (main Claude session) never loses the whole picture — it reviews each subagent result before proceeding. Subagents are "amnesiac": they get a precise brief, do one task, and return. The orchestrator synthesizes.

### Per-Task Discipline

Every individual task runs under these skills:

| Skill | When it applies |
|-------|----------------|
| `test-driven-development` | Always — failing test → implement → pass. No implementation without a test. |
| `systematic-debugging` | When a bug or unexpected failure appears — find root cause before proposing fixes. |
| `verification-before-completion` | Before claiming any task done — must show command output as evidence. |
| `nx-git-workflow` | Conventional commits, trunk-based branches, Nx `affected` awareness. |
| `/commit` command | Generates well-formed commit messages: `<emoji> <type>(<scope>): <description>`. |

### Domain-Specific Skills

These activate automatically when context matches:

| Skill | Auto-triggers when |
|-------|-------------------|
| `ts-cli` | Building a CLI tool (Clipanion + Ink) |
| `react-component` + `shadcn` | Building UI components (shadcn/ui + Radix + Tailwind v4) |
| `gherkin-features` | Writing BDD acceptance tests |
| `lingui-best-practices` | Adding or modifying i18n in a React app |
| `fallow` | Questions about dead code, circular deps, or complexity |
| `domain-driven-design` | Designing new domain models or bounded contexts |

---

## Stage 5: Quality Gates (Automated)

These run without human action. They block progress if they fail.

| Gate | Trigger | Tool | What it checks |
|------|---------|------|----------------|
| `qa:lint` | Pre-push + every PR | Biome | Code style, formatting, import order |
| `qa:arch-check` | Pre-push + every PR | dependency-cruiser | Layer violations: no handler→repo direct import; no service→handler import; no cross-package relative paths; no circular dependencies. See [docs/arch-check.md](arch-check.md). |
| `qa:audit` | Pre-push + every PR | Fallow (changed files only) | Dead exports, unused code, complexity spikes introduced by the current change |
| `qa:dead-code` | Weekly CI | Fallow (full repo) | Accumulated dead code across the whole codebase |

The pre-push hooks run via `lefthook`. There is no `--no-verify` shortcut in the normal workflow. If a gate fails, the push is blocked until the issue is fixed.

Skill `verification-before-completion` ensures Claude runs `pnpm qa` and reads the output before reporting a task complete.

---

## Stage 6: Integration & Review

| Skill / Command | Purpose |
|-----------------|---------|
| `finishing-a-development-branch` | Presents structured options: squash-merge, PR, or cleanup — based on the state of the branch. |
| `/create-pull-request` | Opens a draft PR via `gh` CLI, conventional commit title, body with summary + test plan. |
| `requesting-code-review` | Dispatches a reviewer subagent with precise context: what changed, what to verify, what tradeoffs were made. |
| `receiving-code-review` | Disciplines Claude's response to review feedback: verify before implementing, push back technically when warranted, no performative agreement. |
| `git-safety` | Enforced rules: no force-push, no `reset --hard` without explicit user instruction. |

**Human review gate:** PR review and merge. Merging = human sign-off. No auto-merge, ever.

---

## Stage 7: Communication

**Trigger:** A PR merges, a package publishes, or a feature ships that's worth telling people about — or the human explicitly asks for a draft.

**Directory:** `communication/`

**AI touchpoint:** Skill `communication`, command `/communicate`

The `communication` skill operates a lightweight idea → draft → review → publish workflow for outward-facing content about work done in this repo:
- Spotting shippable work and offering to log it to `communication/ideas.md` (never auto-logs without asking)
- On explicit request, drafting channel-appropriate content (LinkedIn short-form, dev.to long-form technical writeup) into `communication/posts/<subject>-<date>/<channel>/`, grounded in real commits/PRs/source — no invented claims
- Style rules live in `communication/voice.md`; channel norms live in `communication/channels.md`

**Human review gate:** The human reviews every draft and publishes manually — there is no auto-post integration to LinkedIn or dev.to. This is distinct from changelog/release-note generation, which is fully automated by `nx release` per [ADR 0013](adrs/0013-release-strategy.md); this stage is purely social/marketing content.

---

## Stage 8: Production

"Production" in Europa means: software that is depended on, deployed, or used in a way that matters when it breaks.

**Where production artifacts live:**

| Directory | What lives there |
|-----------|-----------------|
| `apps/` | CLI tools, web servers, desktop apps |
| `packages/` | npm/GitHub libraries (`@mlabrut/*`) |
| `agents/` | Deployed AI agents |
| `embedded/` | Flashed IoT firmware (ESPHome) |

### Agents as Production AI Workers

Agents in `agents/` are self-contained, config-driven AI workers. They share infrastructure in `agents/_core/` (`@mlabrut/agent-core`). Each agent has:
- `agent.yaml` — declarative identity: model, skills, tools, behavior constraints
- `engagement.yaml` — per-run configuration (what company/project to target)

Two agents are currently in service:

| Agent | What it does | Sub-skills it dispatches |
|-------|-------------|--------------------------|
| `cartographer` | Discovers company system architecture from git repos. Produces CALM model (`architecture.calm.json`), Mermaid diagram, and summary. Commits to a branch, opens a PR for human review. **Strictly read-only** — never modifies target repos. | workspace-setup → repo-scanner → framework-detector → api-extractor → async-detector → infra-analyzer → calm-builder |
| `dailylife` | Personal AI assistant. Captures todos, shopping, projects from natural-language commands. Organizes in Notion databases with time-blocking. | intent-router → notion-task-manager / shopping-list-manager / calendar-scheduler |

Agents always commit to dedicated branches and open PRs — they never push directly to `main`.

---

## Stage 9: Maintenance & Deprecation

New features re-enter the pipeline at Stage 2 (new PRD) or Stage 3 (new issue on existing epic). Bug fixes re-enter at Stage 4 directly.

**AI tools for maintenance:**

| Tool | Purpose |
|------|---------|
| `fallow` skill + `qa:dead-code` weekly scan | Surface unused exports, dead files, accumulating complexity |
| `get_cleanup_candidates` MCP tool | Prioritize tech debt by blast radius and runtime hotspot data |
| `get_blast_radius` MCP tool | Understand the downstream impact of removing or changing a module |
| `ccpm` `/standup`, `/status`, `/next` | Track active work across issues, surface blockers, determine priority |
| `systematic-debugging` | Root-cause analysis for production bugs before any fix is attempted |

**Human decision:** Deprecation is always a human call. AI surfaces candidates and blast radius data; the human decides what to remove.

---

## Summary: Human Review Gates

| Stage | Gate | What the human decides |
|-------|------|------------------------|
| 1 → 2 | Idea promotion | Is this worth building? |
| 2 → 3 | PRD approval | Does this capture intent correctly? |
| 3 → 4 | Epic + Plan approval | Is the decomposition right? Is the approach right? |
| 4 (internal) | Task-level review | Subagent output reviewed by orchestrator before next task (AI-to-AI review) |
| 5 | QA gate | Automated — blocks push if failed |
| 6 → 7 | PR merge | Human reads diff, approves, merges |
| 7 → 8 | Communication draft | Human reviews and manually publishes — no auto-post |
| Maintenance | Deprecation | Human decides what dies |

---

## Persistent Context: Memory

Claude maintains a session-persistent memory system in `.agents/memory/`. Memory files store:
- User preferences and working style
- Project context (active work, decisions, constraints)
- Feedback on past approaches (what to avoid, what worked)
- References (external systems, dashboards, data sources)

Memory is indexed in `.agents/memory/MEMORY.md` (loaded at session start). It is git-tracked — it survives across machines and sessions. See [CLAUDE.md](../CLAUDE.md) for the full memory system description.
