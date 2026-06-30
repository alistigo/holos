# Source: SKILL.md (nx-git-workflow)

- **Origin**: Custom skill authored for Europa monorepo
- **Created**: 2026-03-14

## Research sources

- https://nx.dev/recipes/nx-release/get-started-with-nx-release
- https://nx.dev/concepts/affected
- https://nx.dev/blog/versioning-and-releasing-packages-in-a-monorepo

## Notes

- Trunk-based development chosen over classic git-flow (main + develop) — Nx communities
  recommend trunk-based for monorepos to avoid merge conflicts at scale
- Integrates with the existing /commit and /create-pull-request commands
