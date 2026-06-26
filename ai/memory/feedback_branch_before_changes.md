---
name: feedback_branch_before_changes
description: Always create a feature branch before making any changes when currently on main
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 34b31cda-abc2-4749-8dab-c8447fc03bec
---

Always create a feature branch before touching any files when the current branch is `main`.

**Why:** User flagged this explicitly — changes directly on main are not the intended workflow. Plans should include branch creation as Task 0.

**How to apply:** In any implementation plan (writing-plans skill), add a Task 0 that runs `git checkout -b <branch-name>` when the session starts on `main`. Branch naming follows the repo convention: `feat/`, `fix/`, `chore/`, `docs/` prefixes.
