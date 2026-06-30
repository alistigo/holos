---
name: nx-git-workflow
description: Git workflow for the Holos Nx monorepo. Covers branching strategy,
  nx affected usage, conventional commits with scope, and the nx release process.
  INVOKE WHEN: creating branches, starting features, doing releases, merging PRs, adding new apps/packages/projects to the monorepo.
---

# Nx Monorepo Git Workflow

Holos uses **trunk-based development**: short-lived branches merged directly to `main`.
This is the recommended model for Nx monorepos — it avoids merge conflicts from
long-lived branches and pairs well with `nx affected` which only builds/tests what changed.

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/add-auth-service` |
| Bug fix | `fix/<description>` | `fix/api-timeout` |
| Chore / tooling | `chore/<description>` | `chore/update-deps` |
| Documentation | `docs/<description>` | `docs/api-guide` |
| Refactor | `refactor/<description>` | `refactor/simplify-parser` |
| Release | `release/v<version>` | `release/v1.2.0` |
| Hotfix | `hotfix/v<version>` | `hotfix/v1.2.1` |

Rules:
- Use lowercase kebab-case only
- Keep descriptions short (2-4 words)
- Never work directly on `main`

---

## Feature Workflow (daily work)

```bash
# 1. Start from an up-to-date main
git checkout main
git pull

# 2. Create a branch
git checkout -b feat/my-feature

# 3. Work and commit using /commit command

# 4. Before pushing: check only your changes are affected
nx affected -t build --base=main --head=HEAD
nx affected -t test --base=main --head=HEAD

# 5. Push and open a draft PR to main
git push -u origin feat/my-feature
gh pr create --draft --base main
# → use /create-pull-request for structured PR body

# 6. Mark ready when done, leave merge to human reviewer
gh pr ready <PR-NUMBER>
```

---

## Conventional Commits + Nx Scope

Use the **Nx project name** as the commit scope. This gives context even though
Nx uses file paths (not scope) to determine affected projects.

```bash
feat(api): add new /users endpoint        # packages/api or apps/api
fix(ui): resolve button focus bug         # packages/ui
chore(root): update pnpm lockfile         # root-level change
docs(embedded): update ESPHome flash guide
```

See the `/commit` command for the full emoji + type reference.

### Version bump rules (for `nx release`)

| Commit type | Version bump |
|-------------|-------------|
| `fix:` | patch (1.0.0 → 1.0.1) |
| `feat:` | minor (1.0.0 → 1.1.0) |
| `feat!:` or `BREAKING CHANGE:` | major (1.0.0 → 2.0.0) |

---

## Checking What's Affected

Always run `nx affected` before pushing to understand the blast radius of your changes:

```bash
# Compare your branch against main
nx affected -t build --base=main --head=HEAD
nx affected -t test --base=main --head=HEAD
nx affected -t qa:lint --base=main --head=HEAD

# Show which projects are affected (no task run)
nx show projects --affected --base=main --head=HEAD
```

In CI, use:
```bash
nx affected -t build --base=origin/main --head=$BRANCH
```

---

## Release Process

Holos uses `nx release` to version packages, generate changelogs, and create git tags.
Run only from `main` after merging feature work.

```bash
# 1. Preview what nx release will do (always dry-run first)
nx release --dry-run

# 2. Execute: bumps package.json versions, generates CHANGELOG.md, commits + tags
nx release

# 3. Push the release commit and tags
git push origin main --follow-tags

# 4. Publish packages (if applicable)
nx release publish
```

`nx release` reads conventional commits since the last tag and:
- Determines version bumps per project based on commit types
- Generates or appends to `CHANGELOG.md` per project
- Creates a release commit: `chore(release): publish {version}`
- Creates a git tag: `v{version}`

### Release branch (optional, for pre-release QA)

If the release needs QA validation before hitting `main`:

```bash
git checkout -b release/v1.2.0 main
# fix release-only issues if needed
nx release --dry-run
nx release

git checkout main
git merge --no-ff release/v1.2.0
git push origin main --follow-tags
git branch -d release/v1.2.0
```

---

## Hotfix Process

For urgent production fixes that cannot wait for the normal feature cycle:

```bash
# 1. Branch from main (current production state)
git checkout main
git pull
git checkout -b hotfix/v1.2.1

# 2. Fix and commit
git commit -m "🚑️ fix(api): patch critical auth bypass"

# 3. Release the hotfix
nx release --dry-run
nx release

# 4. Merge back to main
git checkout main
git merge --no-ff hotfix/v1.2.1
git push origin main --follow-tags

# 5. Clean up
git branch -d hotfix/v1.2.1
```

---

## Quick Reference

```bash
# Start work
git checkout main && git pull
git checkout -b feat/<description>

# Check impact before PR
nx show projects --affected --base=main --head=HEAD

# Commit — use /commit command for conventional commits with emoji

# Push + open PR
git push -u origin <branch>
gh pr create --draft --base main   # use /create-pull-request for full template

# Release (from main only)
nx release --dry-run
nx release && git push origin main --follow-tags
```
