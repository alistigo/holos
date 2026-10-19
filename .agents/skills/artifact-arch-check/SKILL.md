---
name: artifact-arch-check
description: Harness for the artifact-arch-check CLI — use when creating a new artifact, checking architecture conformance, or diagnosing package boundary violations.
metadata:
  type: authored
---

# artifact-arch-check — Architecture Conformance Harness

## When to Trigger

- User creates a new artifact or scaffolds new packages
- User asks "does the list artifact conform to the architecture?"
- User sees a boundary violation or missing package error from this tool
- User wants to add a dependency between artifact packages
- User says "check the arch", "run arch-check", "validate the architecture"
- Any mention of `artifact-arch-check`, `alistigo-metadata`, or `module-existence`

## Key Commands

```bash
# Generate a CALM file for a new artifact (run once per artifact)
bun cli/artifact-arch-check/dist/cli.js generate <name>
# → writes packages/architecture/systems/<name>-artifact.arch.calm.json

# Check all 4 checks
bun cli/artifact-arch-check/dist/cli.js check <name>

# Check specific checks
bun cli/artifact-arch-check/dist/cli.js check <name> --only module-existence
bun cli/artifact-arch-check/dist/cli.js check <name> --only module-existence,boundaries

# Machine-readable output (for parsing, CI, or agent use)
bun cli/artifact-arch-check/dist/cli.js check <name> --json

# Build the CLI first if dist/ is stale
pnpm nx run artifact-arch-check:build
```

## Artifact Slots — What Gets Substituted

When `generate` runs, these 5 nodes are substituted with artifact-specific package names:

| Node ID | Generated package |
|---------|-----------------|
| `domain` | `@alistigo/{name}-domain` |
| `document` | `@alistigo/{name}-document` |
| `ui` | `@alistigo/{name}-components-react` |
| `application` | `@alistigo/artifact-{name}` |
| `skill` | `@alistigo/artifact-{name}-skill` |

Shared nodes (`plugin-bus`, `storage-plugin`, `logger-plugin`) are copied unchanged.

## Interpreting Output

### `module-existence` failures

Package directory or `package.json` is missing. Fix:

```bash
bash scripts/new-package.sh <short-name>
# e.g. bash scripts/new-package.sh list-domain
```

Optional nodes (plugins, plugin-bus) are never checked — only `domain`, `document`, `ui`, `application`, `skill` are mandatory.

### `boundaries` failures

A package declares an `@alistigo/*` dependency that has no corresponding `connects` relationship in the CALM file.

Two paths to fix:

**A — Remove the forbidden dependency** (correct if the dependency is wrong):
```bash
# Remove from packages/<short-name>/package.json
pnpm remove @alistigo/<forbidden-pkg> --filter @alistigo/<short-name>
```

**B — Add a CALM relationship** (correct if the dependency is intentional):
Edit the artifact's CALM file to add a `connects` entry:
```json
{
  "unique-id": "ui-uses-domain",
  "description": "UI reads domain value objects for display.",
  "relationship-type": {
    "connects": {
      "source": { "node": "ui" },
      "destination": { "node": "domain", "interfaces": ["domain-api"] }
    }
  }
}
```

Then re-run — the boundaries check derives allowed deps from relationships automatically.

### `package-conformance` failures

Required fields missing from `package.json`. The template in `scripts/new-package.sh` has all required fields. Missing fields by type:

- `exports` — add `"exports": { ".": { "import": "./dist/index.js" } }`
- `publishConfig.access` — add `"publishConfig": { "access": "public" }`
- `types` — add `"types": "./dist/index.d.ts"`

### `alistigo-metadata` failures

Add or correct the `alistigo` field in the package's `package.json`:

```json
{
  "alistigo": {
    "type": "domain"
  }
}
```

Expected value by node:

| Node | `alistigo.type` |
|------|----------------|
| `domain` | `"domain"` |
| `document` | `"application"` |
| `ui` (components-react) | `"presentation"` |
| `application` (artifact-{name}) | `"application"` |
| `skill` | `"skill"` |
| plugin nodes | `"plugin"` |

## Workflow for a New Artifact

```bash
# 1. Generate the CALM file
bun cli/artifact-arch-check/dist/cli.js generate <name>

# 2. Scaffold all mandatory packages
bash scripts/new-package.sh <name>-domain
bash scripts/new-package.sh <name>-document
bash scripts/new-package.sh <name>-components-react
bash scripts/new-package.sh artifact-<name>
# skill package lives under packages/artifact-<name>-skill

# 3. Add "alistigo" type to each package.json (replace TODO placeholder)

# 4. Verify
bun cli/artifact-arch-check/dist/cli.js check <name>
```

## Key Files

| Path | Purpose |
|------|---------|
| `packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json` | Canonical template — never edit directly for per-artifact changes |
| `packages/architecture/systems/<name>-artifact.arch.calm.json` | Per-artifact CALM file — edit to update relationships |
| `cli/artifact-arch-check/src/` | CLI source |
| `cli/artifact-arch-check/dist/cli.js` | Built entry point (build before running) |
| `cli/artifact-arch-check/docs/README.md` | Full CLI reference |
| `websites/alistigo/src/content/docs/tools/artifact-arch-check.mdx` | Website doc page |

## Boundaries Logic

The `boundaries` check builds the allowed-deps map at runtime from the CALM file:

1. For each `connects` relationship, the source node is allowed to depend on the `core-npm-package` of the destination node.
2. Any `@alistigo/*` dep in `dependencies`, `devDependencies`, or `peerDependencies` outside that set is a violation.
3. Skill nodes are exempt (no runtime code deps by design).
4. Plugin nodes are exempt (optional infrastructure).

This means: if you add a `connects` relationship, the check automatically permits the new dependency without any CLI changes.
