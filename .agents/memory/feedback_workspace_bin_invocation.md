---
name: workspace-bin-invocation
description: Avoid pnpm bin system for calling workspace CLI packages in Nx project.json commands — use bun/node direct invocation instead
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3509f38e-d860-4163-b57b-db4fb8c97120
---

In Nx `project.json` commands that call a workspace CLI package (e.g. `pnpm calm-to-archify build ...`), always use a direct `bun` invocation instead of relying on pnpm's bin resolution.

**Why:** pnpm creates bin symlinks for workspace packages during `pnpm install`, but only if the package's `dist/cli.js` already exists. In CI (fresh checkout), the TypeScript hasn't been compiled yet, so pnpm emits a `WARN Failed to create bin` and skips the symlink. Later Nx builds create `dist/cli.js`, but the missing symlink is never re-created. Commands then fail with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "X" not found`. This is silent locally because developers always have pre-existing `dist/` files.

**How to apply:** In `project.json` targets that run a workspace CLI binary, use `bun ../../path/to/dist/cli.js <args>` with a relative path from the target's `cwd` to the compiled entry point. The `dependsOn` chain already guarantees the compiled file exists before the command runs — no bin symlink needed.

```jsonc
// ❌ breaks in CI (bin symlink not created if dist/ doesn't exist at install time)
"command": "pnpm calm-to-archify build systems/*.arch.json"

// ✅ works everywhere — direct invocation, no symlink dependency
"command": "bun ../../cli/calm-to-archify/dist/cli.js build systems/*.arch.json"
```

Note: this repo uses **Bun** as the runtime, not Node. Always use `bun` here, not `node`.
