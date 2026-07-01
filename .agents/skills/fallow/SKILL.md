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

`.fallowrc.json` at repo root. Edit `ignorePatterns` to suppress false positives (e.g. dynamic imports, reflection-based code, generated files).

## Workflow

1. Run `pnpm run qa:dead-code` to see full picture
2. Run `pnpm exec fallow fix --dry-run` to preview safe removals
3. Review dry-run output, then `pnpm exec fallow fix` to apply
4. Run `pnpm run qa:dead-code` again to verify clean state
5. Commit: `chore(cleanup): remove dead code via fallow`
