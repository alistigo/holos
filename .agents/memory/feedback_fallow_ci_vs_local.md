---
name: feedback_fallow_ci_vs_local
description: Fallow CI action installs latest ^2.x.x which may differ from local version — always reproduce CI findings with the exact fallow version before fixing
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb3583fb-f250-40b4-b68f-3669c989b5d9
---

Always verify fallow findings with the **same version CI uses** before acting on them.

**Why:** The `fallow-rs/fallow@v2` GitHub Action reads the semver range from `package.json` (`^2.80.0`) and installs the **latest matching release** (e.g. `2.104.0`). Local dev only has `2.80.0`. Version differences produce different complexity scores for the same code — a "fix" that passes locally can make CI worse.

**How to apply:**
1. Check CI logs for `Installed fallow fallow X.Y.Z` to find the version CI used
2. Install that exact version locally: `npm install -g fallow@X.Y.Z`
3. Run `fallow audit --base <merge-base-sha>` to reproduce the exact CI finding
4. Only then write a fix

**Key facts:**
- CI uses `auto-changed-since: true` with `NX_BASE` set by `nrwl/nx-set-shas@v4` (PR merge-base with main)
- Local `fallow audit` without `--base` compares against the branch tip (usually 0 changed files vs itself)
- To reproduce CI locally: `git merge-base main HEAD` → use that SHA as `--base`
- The "Check threshold" step fails when `VERDICT=fail` (1+ error-severity finding in changed files)
- `diff-filter: added` in the action means only ADDED lines' associated files are in scope

**Complexity suppression pattern (established in repo):**
`// fallow-ignore-next-line complexity` before a function declaration suppresses CRAP/cognitive/cyclomatic for that function. Use for top-level React page components that have many hooks (not algorithmic complexity), same as the tokenizer functions in CodeHighlight.tsx.
