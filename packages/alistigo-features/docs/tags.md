# Tag Taxonomy

The full set of tags this package recognizes. Adding a tag here without also adding it to [`src/tags.ts`](../src/tags.ts) (or vice versa) is a lint error — the validator (`pnpm validate`) enforces parity.

Tags are stripped from human-readable output but power runner filtering, suite assembly, and reporting.

## Categories

Each tag falls into exactly one category. The category determines where it goes (Feature-level vs Scenario-level), and whether it's required.

| Category | Required? | Where | Purpose |
|----------|-----------|-------|---------|
| **Milestone** | yes — exactly one | Feature-level | Which milestone owns this feature |
| **Group** | yes — exactly one | Feature-level | Which feature group (mirrors the folder under `features/`) |
| **Capability** | yes — at least one | Feature-level | What the app does |
| **Test type** | no | Scenario-level | What kind of scenario |
| **Suite** | no | Scenario-level | Which named runs include it |
| **Actor** | no | either | Who triggers the scenario |

## Milestone tags

Exactly one per Feature. See [`projects/alistigo-ai/milestones.md`](../../../projects/alistigo-ai/milestones.md).

| Tag | Means |
|-----|-------|
| `@m1` | Milestone 1 — Todo list MVP |
| `@m2` | Milestone 2 — Plugin architecture |
| `@m3` | Milestone 3 — Second list type via plugins |
| `@m4` | Milestone 4 — Host ↔ iframe protocol |
| `@v1` | Milestone 5 / 1.0 — Public beta |

## Group tags

Exactly one per Feature. The group must match the immediate parent folder under `features/` — the validator (`pnpm validate`) enforces this. Group is the *folder dimension* of organization; milestone is the *time dimension*.

| Tag | Means |
|-----|-------|
| `@core` | Base list app — text elements, add, delete, persist (no plugins loaded) |

Plugin groups will be added as plugins land — likely `@todo`, `@checklist`, `@grocery`, `@wishlist`, etc. Each plugin lives in its own folder under `features/` and uses a matching tag.

## Capability tags

At least one per Feature.

| Tag | Means |
|-----|-------|
| `@capability:list` | Operations on the list itself (create, rename, count, display) |
| `@capability:element` | Operations on elements within a list (add, delete) |
| `@capability:persistence` | Storage of the event log / projection (localStorage, IndexedDB) |
| `@capability:loading` | Loading documents into the app (URL fragment, host push, default) |
| `@capability:export` | Exporting documents (projection-only or projection+log) |
| `@capability:host-protocol` | postMessage exchange with the host page |
| `@capability:plugins` | Plugin lifecycle, validation, and contributions |

## Test-type tags

Zero or one per Scenario. (More than one is a smell: pick the most specific.)

| Tag | Means |
|-----|-------|
| `@happy-path` | The golden path — what users will do most of the time. Should never fail. |
| `@edge-case` | Boundary conditions: empty lists, duplicate names, max-length strings |
| `@error-path` | Validation failures, schema rejection, unknown event types |

## Suite tags

Zero or more per Scenario. Composable.

| Tag | Means |
|-----|-------|
| `@smoke` | The smallest representative subset to run on every commit. Keep tiny. |
| `@regression` | The full milestone suite — what blocks a milestone from being marked done |
| `@todo` | Todo; runner skips by default |

## Actor tags

Zero or one per Feature or Scenario.

| Tag | Means |
|-----|-------|
| `@actor:user` | A human user |
| `@actor:ai` | An AI assistant |
| `@actor:host` | The host page itself |

## Adding a new tag

1. Add it to the appropriate constant array in [`src/tags.ts`](../src/tags.ts).
2. Add a row to the relevant category table in this file.
3. Run `pnpm validate` — it will refuse if the taxonomy and the actual feature usage are out of sync.

## Removing a tag

1. `grep` the package for the tag — make sure no `.feature` still uses it.
2. Remove from `src/tags.ts`.
3. Remove from this file.
4. `pnpm validate` to confirm.

## Why a typed taxonomy

Untyped tags are fine for a hobby project but hostile to a TDD workflow:

- The runner needs to know which tags are valid before assembling a suite.
- Renames and typos go unnoticed otherwise (`@happy_path` vs `@happy-path` quietly skips your smoke test).
- A typed taxonomy means tooling can autocomplete, lint, and report against a closed set.

The cost is one entry in two places when a tag is added; the upside is a stable contract between the features, the runner, and CI.
