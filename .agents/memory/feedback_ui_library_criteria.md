---
name: UI library selection criteria — AI docs + linting are part of the bar
description: When evaluating any UI library / framework, treat first-class AI documentation (llms.txt + MCP + agent skills) as a P2 must-look-at, and library-aware linting as a P3 plus.
type: feedback
originSessionId: 804d93c9-d5ea-4464-b81d-01e50d44a818
---
When recommending or evaluating a UI library, framework, or major SDK for any
project in this repo, the user's selection criteria include — beyond the
usual size/ARIA/theming/community concerns — two requirements that are easy
to forget:

- **AI documentation surface** (priority: must check, P2): `llms.txt`,
  `llms-full.txt`, an official MCP server, and/or an agent skill. The user
  collaborates with coding agents heavily; libraries with no AI docs make
  every upgrade a hand-rolled prompt-engineering exercise.
- **Library-aware linting** (priority: nice-to-have, P3): an official or
  well-maintained ESLint / Biome / oxlint plugin, or a CLI subcommand that
  detects drift from idiomatic usage (e.g. `shadcn diff`).

**Why:** The user's apps are built collaboratively with AI agents and
embedded in surfaces where consistency over time matters. AI docs make
agent edits stay correct as the library evolves; linting catches drift
before review.

**How to apply:** Whenever the user asks for a library evaluation
(UI, animation, ORM, validation, CLI framework, etc.), include these two
in the comparison matrix even if the user didn't explicitly list them.
For UI libraries specifically, the full priority-ordered requirements
list lives at
[`projects/alistigo-ai/ui-library-research.md` §2](../../../../../Volumes/Workspace/europa/projects/alistigo-ai/ui-library-research.md)
and should be reused as a template when scoring other React UI choices in
this repo.
