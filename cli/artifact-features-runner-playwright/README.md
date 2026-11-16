# artifact-features-runner-playwright

A generic Playwright-backed Cucumber runner for Alistigo artifact features packages. Given any `features` package (e.g. `@alistigo/list-features`) and a playground host URL, it dynamically loads the package's Gherkin `.feature` files and step definitions and executes all scenarios against the target host.

## Usage

```sh
# From repo root (via bun, no build required)
bun cli/artifact-features-runner-playwright/src/cli.ts \
  --target=@alistigo/list-features \
  --host=http://localhost:4173

# Or via Nx after building
nx run artifact-features-runner-playwright:test:list
```

## Options

| Flag | Required | Description | Default |
|------|----------|-------------|---------|
| `--target` | yes | npm package name of the features package to run (e.g. `@alistigo/list-features`) | — |
| `--host` | no | Base URL of the playground to test against | `http://localhost:4173` |

**Exit code:** `0` if all scenarios pass, `1` if any scenario fails or if the target package is invalid.

## Features package contract

A valid `--target` package must:

1. Declare `"alistigo": { "type": "features", "domain": "<domain>" }` in its `package.json`.
2. Export `FEATURES_DIR` — absolute path to the directory containing `.feature` files.
3. Export `STEP_DEFINITIONS_DIR` — absolute path to the compiled step definition files.
4. Optionally export `SUPPORT_DIR` — absolute path to compiled support/hooks files (World class, before/after hooks).

**Example `src/index.ts`:**

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const __distDir = path.dirname(fileURLToPath(import.meta.url));

export const FEATURES_DIR = path.resolve(__distDir, "..", "features");
export const STEP_DEFINITIONS_DIR = path.resolve(__distDir, "step-definitions");
export const SUPPORT_DIR = path.resolve(__distDir, "support");
```

## Adding a new features package

1. Scaffold a package under `packages/<domain>-features/`.
2. Add `"alistigo": { "type": "features", "domain": "<domain>" }` to its `package.json`.
3. Place Gherkin `.feature` files under `features/` (not compiled — these are copied to `dist/` by the build).
4. Write step definitions in `src/step-definitions/` and support hooks in `src/support/`.
5. Export `FEATURES_DIR`, `STEP_DEFINITIONS_DIR`, and `SUPPORT_DIR` from `src/index.ts`.
6. Run `pnpm nx run artifact-features-runner-playwright:build` and then:
   ```sh
   bun cli/artifact-features-runner-playwright/src/cli.ts --target=@alistigo/<domain>-features
   ```

No changes to this runner CLI are required.
