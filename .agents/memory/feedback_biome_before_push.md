---
name: feedback-biome-before-push
description: Always run pnpm biome check --write before committing or pushing
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f6c8c9fc-8adb-4de9-868e-dc1193f978df
---

Always run `pnpm biome check --write .` before committing or pushing changes.

**Why:** CI catches biome issues (import order, formatting, etc.) that the pre-push hook's read-only lint check may not auto-fix, leading to avoidable red builds.

**How to apply:** After making all code changes and before `git add` / `git commit`, run `pnpm biome check --write .` from the repo root. If it modifies files, stage and include those changes in the commit.
