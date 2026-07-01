---
name: architecture-decision-records
description: Capture architectural decisions as structured ADR documents. Auto-detects decision moments in conversation and produces files that live alongside the code so future developers understand why the codebase is shaped the way it is.
metadata:
  type: authored
---

<!-- SOURCE: https://github.com/affaan-m/everything-claude-code/blob/main/skills/architecture-decision-records/SKILL.md -->
<!-- REASON: Adapted to Europa repo conventions: YAML frontmatter, comparison tables, dual location rule (docs/adrs/ for repo-wide, projects/<app>/adrs/ for app-specific), and matching format from existing ADRs -->
<!-- COPIED: 2026-06-10 -->

# Architecture Decision Records

Capture architectural decisions as they happen. Instead of decisions living only in Slack threads,
PR comments, or someone's memory, this skill produces structured ADR documents that live alongside
the code.

## When to Activate

- User explicitly says "write an ADR", "record this decision", or "ADR this"
- User is choosing between significant alternatives (framework, library, pattern, database, API design)
- User says "we decided to..." or "the reason we're doing X instead of Y is..."
- User asks "why did we choose X?" — read existing ADRs
- During planning phases when architectural trade-offs are discussed
- Choosing between security, deployment, or process strategies

## ADR Format

This repo uses YAML frontmatter + structured markdown sections. Match the format exactly:

```markdown
---
status: accepted
date: YYYY-MM-DD
deciders: [Your Name]
---

# ADR NNNN — Decision Title

**Status:** Accepted  
**Date:** YYYY-MM-DD

## Context

What situation, constraint, or need is prompting this decision?
Include a requirements table for decisions with multiple criteria:

| ID | Requirement | Priority |
|----|-------------|----------|
| R1 | ... | P1 |

## Decision

What was decided? State it clearly in 1–3 sentences.

## Rationale

Why this option over the alternatives? Use a comparison table when evaluating candidates:

| Criterion | Option A | **Chosen Option** |
|-----------|----------|-------------------|
| ...       | ...      | ...               |

Explain the decisive factors below the table.

## Consequences

**Positive:**
- benefit

**Negative / tradeoffs accepted:**
- tradeoff

## Alternatives considered

- **Option A** — rejected: reason
- **Option B** — rejected: reason
```

## ADR Location Rules

| Scope | Directory |
|-------|-----------|
| Repo-wide (deployment, CI, tooling, security, branching strategy) | `docs/adrs/` |
| App-specific (library choices, architecture for a specific app) | `projects/<app>/adrs/` |

Always update the `README.md` index in the target directory after writing an ADR.

## ADR Numbering

Scan existing ADRs in the target directory and use the next sequential 4-digit number
(e.g. `0003`, `0004`). Numbers are directory-scoped — `docs/adrs/0001` and
`projects/alistigo-ai/adrs/0001` are independent sequences.

## Workflow

### Capturing a New ADR

1. **Identify the decision** — extract the core architectural choice being made
2. **Gather context** — what problem prompted this? What constraints exist?
3. **Document alternatives** — what other options were considered and why were they rejected?
4. **State consequences** — what are the trade-offs? What becomes easier/harder?
5. **Assign a number** — scan existing ADRs in the target directory and increment
6. **Confirm and write** — present the draft to the user for review before writing the file
7. **Update the index** — add a row to the `README.md` in the same directory

### Reading Existing ADRs

When a user asks "why did we choose X?":

1. Check both `docs/adrs/` and `projects/<relevant-app>/adrs/`
2. Scan the `README.md` index in each for relevant entries
3. Read the matching ADR and present the Context and Decision sections
4. If no match: "No ADR found for that decision. Would you like to record one now?"

## Index Format

Each ADR directory has a `README.md` with this table:

```markdown
| # | Title | Status | Date |
|---|-------|--------|------|
| [0001](0001-kebab-title.md) | Title | Accepted | YYYY-MM-DD |
```

## What Makes a Good ADR

### Do
- **Be specific** — "Use pino for logging" not "use a logging library"
- **Record the why** — the rationale matters more than the what
- **Include rejected alternatives** — future readers need to know what was considered
- **Be honest about trade-offs** — every decision has a cost
- **Keep it short** — readable in 2 minutes
- **Use comparison tables** — they make trade-off analysis scannable

### Don't
- Record trivial decisions (formatting, variable naming, minor config)
- Write more than 10 lines in the Context section
- Omit alternatives — "we just picked it" is not a rationale
- Let ADRs go stale — superseded decisions should reference their replacement

## ADR Lifecycle

```
proposed → accepted → [deprecated | superseded by ADR NNNN]
```

- **proposed**: decision is under discussion, not yet committed
- **accepted**: decision is in effect
- **deprecated**: no longer relevant (e.g. feature removed)
- **superseded**: a newer ADR replaces this one — always link the replacement

## Decision Categories Worth Recording

| Category | Examples |
|----------|---------|
| Technology choices | Framework, language, database, cloud provider |
| Architecture patterns | Monolith vs microservices, event-driven, CQRS |
| API design | REST vs GraphQL, versioning strategy, auth mechanism |
| Infrastructure | Deployment model, CI/CD pipeline, monitoring stack |
| Security | Auth strategy, branch protection, secret management |
| Testing | Test framework, coverage targets, E2E vs integration balance |
| Process | Branching strategy, review process, release cadence |
| Data modeling | Schema design, normalization decisions, caching strategy |
