---
name: Alistigo AI project concept
description: The product concept for Alistigo AI — a base "list app" with plugins on top, NOT a todo-app. Frames how features and milestones should be scoped.
type: project
originSessionId: ab4ae8ca-dc05-4c91-bb0b-0472dcca95d8
---
Alistigo AI is a **base list application** with a plugin system on top. It is NOT a todo app at its core; "todo list" is one of several plugins that compose with the base.

**Why:** The user wants a generalizable list primitive that LLMs can render as artifacts. Todo, checklist, grocery, wishlist, comparison, etc. are all *list types* built by composing the base + plugins.

**How to apply:**

- M1 (the first milestone) is the **base list app** — `features/core/` group. Capabilities: text-only elements, internal-but-not-displayed order, add, delete, persist, allow duplicates. **Never frame M1 as a todo list — that comes via a plugin in M3+.**
- When scoping new features, ask: "Is this a base-list capability or a plugin-specific behavior?" Plugin-specific work belongs in its own group folder (e.g. `features/todo/`, `features/checklist/`) and a different milestone.
- The `@core` tag marks features that belong to the base list — universal across all list types.
- Milestone tags (`@m1`, `@m2`, …) and group tags (`@core`, future plugin groups) are independent dimensions.

Origin: project promoted from `ideas/alistigo-ai/idea.md` to `projects/alistigo-ai/` on 2026-04-28. PR #16.
