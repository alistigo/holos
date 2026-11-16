# Contract: artifact-arch-check features subcommand

New subcommand added to `@alistigo/artifact-arch-check` that scans the entire workspace for features packages and validates their metadata and naming convention.

## Invocation

```sh
artifact-arch-check features [--workspace=<root>] [--json]
```

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `--workspace` | `string` | NO | Current working directory | Path to the workspace root |
| `--json` | `boolean` | NO | `false` | Output results as JSON instead of human-readable |

## Validation rules

For each package in the workspace with `"alistigo": { "type": "features" }`:

| Rule ID | Check | Severity |
|---------|-------|---------|
| `features/naming-convention` | npm name (without scope) ends with `-features` | error |
| `features/domain-required` | `alistigo.domain` field is present and non-empty | error |
| `features/domain-consistent` | `alistigo.domain` value equals the name prefix before `-features` | error |

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | All features packages pass, or no features packages found |
| `1` | One or more violations found |

## Example output (human-readable)

```
Scanning workspace for features packages...

✓ @alistigo/list-features (packages/list-features)
✗ @alistigo/artifact-ai-draw-comments-features (packages/artifact-ai-draw-comments-features)
  [features/naming-convention] Package name must end with "-features" after the scope.
    Got: "artifact-ai-draw-comments-features", domain: "ai-draw-comments"
    Expected name: "@alistigo/ai-draw-comments-features"
  [features/domain-consistent] "alistigo.domain" ("ai-draw-comments") does not match the name prefix ("artifact-ai-draw-comments")

2 packages scanned, 1 error
```

## Nx wiring

```jsonc
// cli/artifact-arch-check/project.json
{
  "targets": {
    "qa:artifact-arch-check:features": {
      "command": "bun src/cli.ts features",
      "cwd": "{workspaceRoot}"
    }
  }
}
```

The root `holos` project's `qa:artifact-arch-check` Nx task is updated to include this new target as a dependency.

## JSON output schema

```json
{
  "summary": { "scanned": 2, "errors": 1, "warnings": 0 },
  "results": [
    {
      "packageName": "@alistigo/list-features",
      "packagePath": "packages/list-features",
      "issues": []
    },
    {
      "packageName": "@alistigo/artifact-ai-draw-comments-features",
      "packagePath": "packages/artifact-ai-draw-comments-features",
      "issues": [
        {
          "rule": "features/naming-convention",
          "severity": "error",
          "message": "Package name must end with '-features' (without scope prefix mapping to domain)"
        }
      ]
    }
  ]
}
```
