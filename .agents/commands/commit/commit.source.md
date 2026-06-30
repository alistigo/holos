# Source: commit.md

- **Origin**: https://github.com/evmts/tevm-monorepo/blob/main/.claude/commands/commit.md
- **Copied**: 2026-03-13

## Changes from original

- Removed `pnpm generate:docs` from pre-commit checks (tevm-specific, Holos doesn't have this)
- Kept `pnpm nx qa:lint` + `pnpm build`; omitted `pnpm test` (too slow for pre-commit)
- Trimmed emoji list to the most commonly used types
