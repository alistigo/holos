# How to Create a Pull Request

Create pull requests using `gh` CLI following Holos conventions.

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth login`)
- Branch pushed to remote
- **Never merge directly to `main`** — always open a PR

## Creating a PR

Fill in `.github/pull_request_template.md` with your summary and test plan, then:

```bash
gh pr create --draft \
  --title "✨ feat(scope): your descriptive title" \
  --body-file .github/pull_request_template.md \
  --base main
```

Or inline if preferred:

```bash
gh pr create --draft \
  --title "✨ feat(scope): your descriptive title" \
  --body "$(cat <<'EOF'
## Summary

- What this PR does
- Why it's needed

## Test plan

- [ ] Describe how to test this change

EOF
)" \
  --base main
```

## PR Title Format

Conventional commit format with emoji:
- `✨ feat(scope): add new feature`
- `🐛 fix(scope): resolve specific bug`
- `📝 docs: update README`
- `♻️ refactor(scope): simplify logic`
- `🔧 chore: update dependencies`

## Best Practices

1. Always create as `--draft` initially
2. Title uses conventional commit format with emoji
3. Body always includes Summary + Test plan sections
4. Convert to ready when complete: `gh pr ready <PR-NUMBER>`
5. **Never merge yourself** — leave for human review

## Useful Commands

```bash
gh pr list --author "@me"    # list your open PRs
gh pr status                  # check status of current branch PR
gh pr view <PR-NUMBER>        # view PR details
gh pr checkout <PR-NUMBER>    # check out a PR locally
gh pr ready <PR-NUMBER>       # mark PR ready for review
gh pr edit <PR-NUMBER> --add-reviewer username  # add reviewer
```
