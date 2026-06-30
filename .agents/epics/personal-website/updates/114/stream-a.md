# Issue #114 — LinkedIn to JSON Resume CLI

status: completed
started: 2026-06-16
completed: 2026-06-16

## Progress

- [x] Scaffold apps/linkedin-to-resume/ (package.json, project.json, tsconfig.json)
- [x] Create src/types/resume.ts (JSON Resume 1.0 interfaces)
- [x] Create src/parsers/profile.ts
- [x] Create src/parsers/positions.ts
- [x] Create src/parsers/education.ts
- [x] Create src/parsers/skills.ts
- [x] Create src/commands/convert.ts
- [x] Create src/index.ts (CLI entry point)
- [x] Create data/resume.json (stub)
- [x] Install dependencies (clipanion 4.0.0-rc.4, adm-zip, csv-parse)
- [x] TypeScript typecheck passes (tsc --noEmit: 0 errors)
- [x] Committed: feat(linkedin-to-resume): scaffold LinkedIn to JSON Resume CLI (#114)

## Notes

- Nx project graph discovery: In git worktree setup, `nx workspaceRoot` resolves
  to the main worktree (`europa`), not the epic worktree. This means `nx run
  linkedin-to-resume:typecheck` cannot be resolved by the Nx CLI when run from
  the worktree. The underlying command (`tsc -p tsconfig.json --noEmit`) passes
  cleanly when run directly.
- clipanion 4.0.0-rc.4 `Option.String` with a default value uses the second
  positional argument (not a `fallback` property) — fixed accordingly.
