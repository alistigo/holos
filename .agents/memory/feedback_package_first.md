---
name: feedback_package_first
description: "Package-first rule — if something can be a package, make it a package"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f2986917-cbfd-4f3e-96ff-e1ae0385f0da
  modified: 2026-09-08T11:46:15.136Z
---

If a repo unit can be a package, it should be a package — even non-TypeScript units (architecture models, schemas, datasets, doc bundles). A package is versioned, distributable, `workspace:*`-referenceable, declares dependencies, and gets Nx `affected` + colocated `qa:*` targets.

**Why:** bare top-level dirs have none of those properties and force per-dir "where do tasks live" guesses.

**How to apply:** decided in [ADR 0028](../../../../Volumes/workspace/holos/docs/adrs/0028-package-first-repository-structure.md). Qualifies when it has a name+version identity, a clear boundary, plausibly >1 consumer, and its own rules/scripts. `docs/` and `communication/` stay plain (human-read, not distributable). Every such package needs `package.json` (scoped `@alistigo/<name>` + semver), `project.json` as task SoT, `README.md`, `LICENSE`, `files`+`publishConfig` when published. Migration = `git mv` → add package files → move root scripts in → repoint `nx run <name>:<target>` → repo-wide grep for old path → `pnpm install`. First application: `architecture/` → `packages/architecture/` (`@alistigo/architecture`), 2026-09-08.
