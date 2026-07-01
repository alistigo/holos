# Claude Command: Commit

Create well-formatted conventional commits with emoji.

## Usage

```
/commit
/commit --no-verify
```

## What This Command Does

1. Unless `--no-verify`, runs pre-commit checks:
   - `pnpm nx qa:lint` — ensure code quality
   - `pnpm build` — verify build succeeds
2. Checks staged files with `git status`
3. If nothing staged, auto-stages all modified/new files with `git add`
4. Runs `git diff` to understand changes
5. Analyzes diff for multiple distinct logical changes
6. If multiple distinct changes detected, suggests splitting into separate commits
7. Creates commit message(s) using emoji conventional commit format

## Conventional Commit Format

`<emoji> <type>: <description>`

Types and emoji:
- ✨ `feat` — new feature
- 🐛 `fix` — bug fix
- 📝 `docs` — documentation
- ♻️ `refactor` — code refactoring
- ⚡️ `perf` — performance improvement
- ✅ `test` — tests
- 🔧 `chore` — tooling/config
- 🚀 `ci` — CI/CD
- 💥 `feat!` — breaking change
- 🔒️ `fix` — security fix
- 🏷️ `feat` — types update
- 🚑️ `fix` — critical hotfix
- ⏪️ `revert` — revert changes
- ➕ `chore` — add dependency
- ➖ `chore` — remove dependency

## Best Practices

- Atomic commits: one logical change per commit
- Present tense imperative: "add feature" not "added feature"
- First line under 72 characters
- If changes span multiple concerns, split into separate commits

## Splitting Commits

Split when diff contains:
- Different concerns (unrelated parts of codebase)
- Mixed types (feature + fix + refactor)
- Mixed file types (source vs docs vs config)

## Examples

Good commit messages:
- `✨ feat: add user authentication`
- `🐛 fix: resolve memory leak in renderer`
- `📝 docs: update API reference`
- `♻️ refactor: simplify error handling`
- `🔧 chore: update biome config`
- `✅ test: add unit tests for parser`

## Options

- `--no-verify` — skip lint + build checks
