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
| `linkedin-post-writer` | write LinkedIn post, hook, draft a post | "Draft a LinkedIn post about X" |
| `linkedin-humanizer` | humanize, de-AI, audit before posting | "Is this post ready to publish?" |
| `linkedin-hook-extractor` | reverse-engineer hook, viral post formula | "Why did this post go viral?" |
| `linkedin-content-planner` | content plan, posting schedule, week of posts | "Plan a week of LinkedIn posts" |
| `linkedin-profile-optimizer` | profile audit, rewrite headline/About | "Rewrite my LinkedIn headline" |
| `linkedin-employee-advocacy` | employee advocacy, team LinkedIn program | "Help me launch a team advocacy program" |
| `linkedin-comment-drafter` | comment on this post, engage, first commenter | "Draft a comment on this post URL" |
| `linkedin-reply-handler` | reply to this comment | "Reply to this comment thread" |
| `linkedin-engager-analytics` | who liked my post, engagers report | "Who engaged with my last post?" |
| `linkedin-thread-monitor` | threads needing follow-up, author replied | "Which of my comments got replies?" |
| `speckit-specify` | spec, specification, requirements, feature spec | "Write a spec for X" |
| `speckit-plan` | plan, implementation plan, from spec | "Create a plan from the spec" |
| `speckit-tasks` | tasks, task list, break down, actionable | "Generate tasks from the plan" |
| `speckit-implement` | implement, execute task, coding task | "Implement task 3" |
| `speckit-constitution` | constitution, principles, project norms | "Set up project principles" |
| `speckit-converge` | converge, remaining work, what's left, codebase audit | "What work is still remaining?" |
| `speckit-clarify` | clarify, de-risk, ambiguous requirements | "Clarify this spec before planning" |
| `speckit-analyze` | analyze, cross-artifact, consistency, alignment | "Check the spec/plan/tasks are aligned" |
| `speckit-checklist` | checklist, validate requirements, completeness | "Validate the spec is complete" |
| `speckit-taskstoissues` | GitHub issues, sync tasks, tasks to issues | "Create GitHub issues from the task list" |

---

## Vendor Submodules (symlinks)

### vendor/linkedin-skills — https://github.com/sergebulaev/linkedin-skills

10 tested LinkedIn skills (post writing, humanizing, hook extraction, profile/content
tooling, comment/reply/analytics). The `communication` skill hands off actual LinkedIn
post drafting to `linkedin-post-writer` rather than owning those rules itself — see
`communication/channels.md`.

| Skill | Purpose |
|-------|---------|
| `linkedin-post-writer` | Draft a new post from scratch using one of 16 hook formulas, picked by engagement goal |
| `linkedin-humanizer` | Scrub AI tells from a draft, or `--mode audit` a finished post against 2026 algorithm heuristics |
| `linkedin-hook-extractor` | Reverse-engineer the hook formula from a viral post URL (research, not drafting) |
| `linkedin-content-planner` | Build a 7-day content plan (pillars, formats, cadence) |
| `linkedin-profile-optimizer` | Rewrite headline/About/Featured/Experience sections |
| `linkedin-employee-advocacy` | Plan a team LinkedIn advocacy program (14-day launch, governance, cadence) |
| `linkedin-comment-drafter` | Draft a comment on someone else's post from its URL |
| `linkedin-reply-handler` | Draft a reply to a specific existing comment |
| `linkedin-engager-analytics` | Segment who liked/commented on a post by ICP fit |
| `linkedin-thread-monitor` | Track which comments earned author replies, flag the warm-reply window |

**Never invoke the Publora auto-post/schedule path** built into `linkedin-post-writer`,
`linkedin-comment-drafter`, or `linkedin-reply-handler` — this repo's communication
workflow never publishes anything automatically (see `communication/SKILL.md`). Use
these skills to draft only, then stop before their "on approval" publish step.
`linkedin-hook-extractor`, `linkedin-engager-analytics`, and `linkedin-thread-monitor`
optionally call Apify (`APIFY_TOKEN`) for read-only scraping — no token is configured
here, so they fall back to manual paste.

---

## Installed via specify-cli (spec-kit)

Installed by `specify init . --integration claude` from https://github.com/github/spec-kit.
Upgrade with: `mise exec uv -- uv tool install --upgrade specify-cli && specify upgrade`.

Core workflow (Spec-Driven Development):

| Skill | Purpose |
|-------|---------|
| `speckit-constitution` | Establish project principles and norms |
| `speckit-specify` | Create a feature spec (`spec.md`) from a description |
| `speckit-plan` | Create an implementation plan (`plan.md`) from the spec |
| `speckit-tasks` | Generate an actionable task list (`tasks.md`) from plan + spec |
| `speckit-implement` | Execute a task from `tasks.md` |
| `speckit-converge` | Audit the codebase and append remaining work as tasks |

Enhancement skills (optional, run between core steps):

| Skill | Purpose |
|-------|---------|
| `speckit-clarify` | Ask structured questions to de-risk ambiguous areas (before `/speckit-plan`) |
| `speckit-analyze` | Cross-artifact consistency report (after `/speckit-tasks`, before `/speckit-implement`) |
| `speckit-checklist` | Validate requirements completeness and clarity (after `/speckit-plan`) |
| `speckit-taskstoissues` | Create GitHub issues from the generated task list |

Project state lives in `.specify/` (committed). Per-feature specs/plans go in `specs/<feature>/`.

---

## Local Copies (copied from external source)

| Skill | Source | Copied | Reason |
|-------|--------|--------|--------|
| `domain-driven-design` | https://github.com/booklib-ai/booklib/blob/main/skills/domain-driven-design/SKILL.md | 2026-05-13 | Copied to freely extend with spec-kit integration (DDD modeling step after spec approval) and project-specific conventions |
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
