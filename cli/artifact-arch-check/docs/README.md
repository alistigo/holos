# artifact-arch-check

A CLI tool that validates Alistigo artifact packages against their CALM architecture definition. It treats the CALM file as the single source of truth: if the architecture says a module must exist and must respect certain boundaries, this tool enforces it.

## Install / usage

The tool is a private CLI in this monorepo. Run it via Nx or Bun:

```sh
# From repo root, after building
bun cli/artifact-arch-check/dist/cli.js check list

# Or via Nx run target
nx run artifact-arch-check:run -- check list
```

## Commands

### `generate <artifact-name>`

Generates a concrete artifact-specific CALM file from the canonical module composition template.

```sh
artifact-arch-check generate todo
# → packages/architecture/systems/todo-artifact.arch.calm.json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--template <path>` | Path to template CALM file | `packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json` |
| `--out <path>` | Output path | `packages/architecture/systems/{name}-artifact.arch.calm.json` |

**What it does:** substitutes the four "artifact slots" in the template:

| Node ID | Generated `core-npm-package` |
|---------|------------------------------|
| `domain` | `@alistigo/{name}-domain` |
| `document` | `@alistigo/{name}-document` |
| `ui` | `@alistigo/{name}-components-react` |
| `skill` | `@alistigo/{name}-skill` |

Shared infrastructure nodes (`application`, `plugin-bus`, `storage-plugin`, `logger-plugin`) keep their platform package names unchanged.

---

### `check <artifact-name>`

Runs conformance checks against the artifact's CALM file and workspace packages.

```sh
artifact-arch-check check list
artifact-arch-check check list --only module-existence,boundaries
artifact-arch-check check list --arch path/to/custom.arch.calm.json
artifact-arch-check check list --json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--arch <path>` | CALM file to check against | `packages/architecture/systems/{name}-artifact.arch.calm.json` |
| `--only <ids>` | Comma-separated check IDs to run | all checks |
| `--json` | Machine-readable JSON output | false |

**Exit code:** `0` if all checks pass, `1` if any fail.

---

## Checks

### `module-existence`

Verifies that every CALM node with a `core-npm-package` field corresponds to an existing package in the workspace.

**How it works:** strips the `@alistigo/` scope from each package name and looks for the directory under `packages/`. Fails if the directory or `package.json` is missing.

**Example error:**
```
✗ module-existence › @alistigo/todo-domain not found
  Expected path : packages/todo-domain/
  Architecture  : todo-artifact.arch.calm.json → node "domain"
  Fix           : bash scripts/new-package.sh todo-domain
  Docs          : packages/architecture/docs/arch-check.md
```

---

### `boundaries`

Verifies that each package only depends on `@alistigo/*` packages that are explicitly permitted by the CALM `connects` relationships.

**How it works:** for each node, collects the `core-npm-package` of all nodes it points to in `connects` relationships. That set is the only `@alistigo/*` dependencies the package may declare. Checks `dependencies`, `devDependencies`, and `peerDependencies`.

**Boundary rules derived from the artifact module composition CALM:**

| Package | Allowed `@alistigo/*` dependencies |
|---------|-------------------------------------|
| `{name}-domain` | none |
| `{name}-document` | `{name}-domain` |
| `{name}-components-react` | `{name}-document` |
| `artifact-core` | `{name}-components-react`, `{name}-document`, `{name}-domain`, `plugin-bus` |
| `plugin-bus` | none |
| `storage-plugin-api` | `plugin-bus` |
| `logger-plugin-api` | `plugin-bus` |
| `{name}-skill` | none (no runtime code dependencies) |

**Example error:**
```
✗ boundaries › @alistigo/todo-domain declares forbidden dependency @alistigo/todo-document
  Rule     : Domain module must have zero @alistigo/* dependencies
  Source   : todo-artifact.arch.calm.json → no "connects" from "domain" to "document"
  Fix      : Remove the dependency or invert the direction (document → domain)
  Docs     : packages/architecture/docs/architecture.md#ddd-layers
```

---

### `package-conformance`

Verifies that each package's `package.json` contains all required fields from the project template.

**Required fields:** `name`, `version`, `license`, `type`, `exports`, `main`, `types`, `files`, `publishConfig.access`

**Example error:**
```
✗ package-conformance › @alistigo/todo-domain is missing required fields
  Missing : exports, publishConfig
  Fix     : Align with the package template in scripts/new-package.sh
  Docs    : packages/architecture/docs/arch-check.md#package-template
```

---

### `alistigo-metadata`

Verifies that each package has the `"alistigo"` metadata field with a valid `type` value. This field allows platform tools to understand a package's architectural role.

**Expected type** is derived from the CALM node's `ddd-layer` and `node-type`:

| CALM `ddd-layer` / `node-type` | Expected `alistigo.type` |
|-------------------------------|--------------------------|
| `ddd-layer: Domain` | `"domain"` |
| `ddd-layer: Application` | `"application"` |
| `ddd-layer: Presentation` | `"presentation"` |
| `ddd-layer: Infrastructure` | `"infrastructure"` |
| `node-type: plugin` | `"plugin"` |
| `node-type: skill` | `"skill"` |

**Example error:**
```
✗ alistigo-metadata › @alistigo/todo-domain is missing "alistigo" metadata
  Expected : { "alistigo": { "type": "domain" } }
  Fix      : Add the "alistigo" field to packages/todo-domain/package.json
  Docs     : cli/artifact-arch-check/docs/README.md#alistigo-metadata
```

---

## `alistigo` metadata field

Every Alistigo package should carry a top-level `"alistigo"` field in its `package.json`:

```json
{
  "name": "@alistigo/list-domain",
  "alistigo": {
    "type": "domain"
  }
}
```

Valid `type` values: `"domain"`, `"application"`, `"presentation"`, `"infrastructure"`, `"plugin"`, `"skill"`.

This field is used by tools (including this CLI) to understand the architectural role of each package without having to parse CALM files directly.

---

## JSON output (for CI and agents)

Use `--json` to get structured output suitable for CI scripts and AI agent consumption:

```sh
artifact-arch-check check list --json
```

```json
{
  "artifactName": "list",
  "calmFile": "packages/architecture/systems/list-artifact.arch.calm.json",
  "passed": false,
  "checks": [
    {
      "checkId": "module-existence",
      "checkName": "Module Existence",
      "passed": true,
      "issues": []
    },
    {
      "checkId": "alistigo-metadata",
      "checkName": "Alistigo Metadata",
      "passed": false,
      "issues": [
        {
          "packageName": "@alistigo/list-domain",
          "message": "Missing \"alistigo\" metadata field",
          "fix": "Add to packages/list-domain/package.json: \"alistigo\": { \"type\": \"domain\" }",
          "docsRef": "cli/artifact-arch-check/docs/README.md#alistigo-metadata"
        }
      ]
    }
  ]
}
```

---

## Architecture

This CLI is documented in ADR 0031. The canonical CALM template it reads from is `packages/architecture/systems/alistigo-artifact-module-composition.arch.calm.json`.
