---
name: fallow
description: Dead code detection and codebase health analysis using fallow. Use when the user asks about unused exports, dead files, circular dependencies, code complexity, or wants to clean up the codebase.
---

# Fallow — Dead Code Analyzer

## When to Trigger

- User asks about unused exports, dead code, or unreachable files
- User wants to clean up the codebase before a release
- User mentions "unused", "dead code", "circular deps", "complexity score"
- Running a codebase health check

## Key Commands

```bash
# Full dead code scan (all unused files + exports)
pnpm run qa:dead-code

# PR risk gate — audits changed files only (fast)
pnpm run qa:audit

# Preview what fallow would auto-remove (no writes)
pnpm exec fallow fix --dry-run

# Code health score
pnpm exec fallow health --score

# Find duplicated logic
pnpm exec fallow dupes

# Watch mode (re-analyze on file changes)
pnpm exec fallow watch
```

## Interpreting Output

- `unused-files: error` — files with no importers; safe to delete if not entry points
- `unused-exports: error` — exported symbols never imported outside their file; demote to non-exported or remove
- `circular-dependencies: error` — investigate and break cycles before they cause runtime issues
- Health score: cyclomatic > 20, cognitive > 15, or CRAP > 30 are refactoring flags

## Config File

`.fallowrc.json` at repo root. Key sections:

- `ignorePatterns` — whole files/directories to exclude (generated files, build artifacts, legacy packages with no source)
- `dynamicallyLoaded` — files whose class members or exports are consumed by a framework at runtime (not via TS imports). Use this instead of inline `// fallow-ignore-next-line unused-class-member` comments. Examples:
  - Playwright `World` subclasses and Page Objects — their methods are called from `.steps.ts` files (which are themselves dynamically loaded)
  - Clipanion `Command` subclasses — Clipanion reads `static paths`, `static usage`, and calls `execute()` via its router
  - Cucumber hooks — lifecycle methods called by the runner
- `ignoreDependencies` — npm packages listed in package.json that fallow can't trace (loaded as UMD, peer deps, or Lingui-compiled)

**Rule of thumb:** when fallow flags `unused-class-member` on a class whose methods are called by a framework (not by TS imports), add that file to `dynamicallyLoaded` in config — don't scatter inline suppression comments.

**Complexity ignores:** `// fallow-ignore-next-line complexity` suppresses both pure complexity (cognitive > 15, cyclomatic > 20) AND CRAP score (>= 30). CRAP fires when a function has no direct test path AND is complex. The remaining ignores in this repo fall into:
- Genuinely complex domain logic (large switch dispatchers, multi-step CLI `execute()`)
- CRAP on functions without a direct test reference (the ignore is correct until tests are added)
- Simulator hooks with inherent multi-case protocol dispatch

## Workflow

1. Run `pnpm run qa:dead-code` to see full picture
2. Run `pnpm exec fallow fix --dry-run` to preview safe removals
3. Review dry-run output, then `pnpm exec fallow fix` to apply
4. Run `pnpm run qa:dead-code` again to verify clean state
5. Commit: `chore(cleanup): remove dead code via fallow`
