# Contract: artifact-features-runner-playwright CLI

The generic Playwright-backed Cucumber runner for Alistigo artifact feature packages.

## Invocation

```sh
artifact-features-runner-playwright --target=<features-package> [--host=<url>]
```

### Arguments

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `--target` | `string` | YES | — | npm package name of the features package to execute (e.g., `@alistigo/list-features`) |
| `--host` | `string` | NO | `http://localhost:4173` | Base URL of the playground to run scenarios against |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | All scenarios passed |
| `1` | One or more scenarios failed, or the runner could not start (invalid target, unreachable host, etc.) |

### Error conditions (exit 1)

- `--target` package not found in local `node_modules`
- Resolved package does not have `"alistigo": { "type": "features" }` in `package.json`
- Resolved package does not export `FEATURES_DIR` or `STEP_DEFINITIONS_DIR`
- `FEATURES_DIR` contains zero `.feature` files (warning printed, exit 1)
- `--host` is not a valid HTTP/HTTPS URL

## Environment behaviour

Before starting cucumber, the runner sets:

```sh
PLAYWRIGHT_BASE_URL=<host>
```

Step definitions use Playwright's standard `page.goto('/')` patterns; the base URL is provided by the environment, not hardcoded in step definitions.

## Nx integration

```jsonc
// cli/artifact-features-runner-playwright/project.json
{
  "targets": {
    "test:list": {
      "command": "bun src/cli.ts --target=@alistigo/list-features",
      "dependsOn": ["build", { "projects": ["list-features"], "target": "build" }]
    }
  }
}
```

Each artifact's features integration test is wired as a named Nx target that depends on building both the runner and the features package.

## Package metadata

```jsonc
{
  "name": "@alistigo/artifact-features-runner-playwright",
  "private": true,
  "alistigo": {
    "type": "infrastructure"
  },
  "bin": {
    "artifact-features-runner-playwright": "./dist/cli.js"
  }
}
```
