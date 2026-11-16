# Data Model: Generic Artifact Features Runner

## Entities

### FeaturesPackage

A workspace package of type `features`. Identified by its npm package name and alistigo metadata.

**Fields:**

| Field | Type | Source | Constraints |
|-------|------|--------|-------------|
| `name` | `string` | `package.json#name` | Must match `@alistigo/${domain}-features` |
| `alistigo.type` | `"features"` | `package.json#alistigo.type` | Exactly `"features"` |
| `alistigo.domain` | `string` | `package.json#alistigo.domain` | Must equal the `${domain}` prefix in the package name |
| `FEATURES_DIR` | `string` | exported from main index | Absolute path to the directory containing `.feature` files |
| `STEP_DEFINITIONS_DIR` | `string` | exported from main index | Absolute path to the directory containing compiled step definition files |

**Naming convention**: For a package `@alistigo/${domain}-features`, the directory name in the workspace is `packages/${domain}-features` (or `packages/artifact-${domain}-features` for artifact-scoped domains — see note below).

**Note on `artifact-ai-draw-comments-features`**: The existing package `@alistigo/artifact-ai-draw-comments-features` does not follow the `${domain}-features` naming convention. Its domain is `ai-draw-comments`, which would dictate the name `@alistigo/ai-draw-comments-features`. Renaming this package is **out of scope** for this feature. Arch-check will flag it as a naming violation; a suppresssion annotation or a future rename PR is the resolution path.

**Validation rules** (enforced by `artifact-arch-check features`):
1. `alistigo.type === "features"` — if `type` is present but not `"features"`, report as wrong type.
2. `alistigo.domain` is present and non-empty — if absent, report as missing required field.
3. `name` ends with `-features` after the scope (i.e., bare name without `@alistigo/` ends with `-features`) — if not, report naming violation.
4. `name`'s prefix before `-features` equals `alistigo.domain` — if mismatch, report domain inconsistency.

---

### RunnerInvocation

The runtime parameters for a single invocation of `artifact-features-runner-playwright`.

**Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `target` | `string` | YES | — | npm package name of the features package (e.g., `@alistigo/list-features`) |
| `host` | `string` | NO | `http://localhost:4173` | Base URL of the playground to test against |

**Validation rules**:
1. `target` must be a resolvable npm package name (the package must exist in the local workspace `node_modules`).
2. The resolved package must have `alistigo.type === "features"` in its `package.json`.
3. The resolved package must export `FEATURES_DIR` and `STEP_DEFINITIONS_DIR` from its main entry point.
4. `host` must be a valid URL (http or https).

---

### FeaturePackageCheck (arch-check output)

Represents the result of validating a single features package.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `packageName` | `string` | The npm package name being validated |
| `packagePath` | `string` | Relative path from workspace root |
| `issues` | `CheckIssue[]` | List of validation failures (empty = pass) |

Each `CheckIssue` has:

| Field | Type | Description |
|-------|------|-------------|
| `rule` | `string` | Rule identifier (e.g., `features/naming-convention`) |
| `severity` | `"error" \| "warning"` | All naming/metadata violations are errors |
| `message` | `string` | Human-readable description of the violation |

---

## State Transitions

### Runner invocation lifecycle

```
INVOKED
  │
  ├─ target not found in node_modules → EXIT(1) "package not found"
  ├─ target found but alistigo.type !== "features" → EXIT(1) "not a features package"
  ├─ target missing FEATURES_DIR or STEP_DEFINITIONS_DIR export → EXIT(1) "invalid package contract"
  │
  └─ all valid → SET PLAYWRIGHT_BASE_URL=<host>
       │
       ├─ host unreachable → EXIT(1) "cannot connect to <host>"
       │
       └─ cucumber runs
            ├─ all scenarios pass → EXIT(0)
            └─ any scenario fails → EXIT(1), list failing scenarios
```

### Arch-check features scan

```
SCAN workspace for packages with alistigo.type === "features"
  │
  ├─ for each package → validate naming + domain consistency
  │    ├─ PASS → no issues
  │    └─ FAIL → collect issues
  │
  └─ all issues collected
       ├─ no issues → EXIT(0)
       └─ any issues → print report, EXIT(1)
```
