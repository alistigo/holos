# artifact-features-runner-playwright

A generic Playwright-backed Cucumber runner for Alistigo artifact features packages. Given any `features` package (e.g. `@alistigo/list-features`) and a playground host URL, it dynamically loads the package's Gherkin `.feature` files and step definitions and executes all scenarios against the target host.

The runner is domain-agnostic: it depends on no features package. `--target` is resolved from the **current working directory**, so the package whose `test:e2e` target invokes the runner is the one that declares the features package as a dependency.

## Commands

| Command | Purpose |
|---------|---------|
| *(default)* | Run all Gherkin scenarios of a features package against a host |
| `doctor` | Check that the runner, the features package and the host all work |

## Running features

The entry point is the consumer's Nx target, which boots the playground, waits for it, and runs the scenarios:

```sh
nx run artifact-list:test:e2e          # starts `vite preview`, runs, tears down
nx run artifact-list:test:e2e-attach   # runs against an already-running playground
```

Direct invocation — note the `cwd`, which must be a package that depends on the features package:

```sh
cd packages/artifact-list
bun ../../cli/artifact-features-runner-playwright/dist/cli.js \
  --target=@alistigo/list-features \
  --host=http://localhost:5173
```

| Flag | Required | Description | Default |
|------|----------|-------------|---------|
| `--target` | yes | npm package name of the features package to run | — |
| `--host` | no | Base URL of the playground to test against | `http://localhost:5173` |

**Exit code:** `0` if all scenarios pass, `1` if any scenario fails or the target package is invalid.

## doctor

`doctor` verifies the whole chain `run` depends on, so a broken setup reports a cause instead of a failing scenario. The host counts as "really the playground" only if an artifact can be selected and that selection reaches the preview iframe and mounts.

```sh
nx run artifact-list:test:e2e-doctor   # against an already-running playground
```

```
artifact-features-runner-playwright doctor

  ✓ Features package: @alistigo/list-features (domain "list") → /workspaces/holos/packages/artifact-list/node_modules/@alistigo/list-features
  ✓ Feature files: 10 .feature file(s) under /workspaces/holos/packages/list-features/features
  ✓ Host reachable: http://localhost:5173 responded 200
  ✓ Playground page: served HTML carries the dev-playground markers
  ✓ Chromium: launched 149.0.7827.55
  ✓ Artifact selector: selected "@alistigo/artifact-list" of 2 offered
  ✓ Preview config: the preview iframe reports app "@alistigo/artifact-list"
  ✓ Artifact mount: the artifact rendered inside the preview iframe

Ready to run features.
```

| Flag | Required | Description | Default |
|------|----------|-------------|---------|
| `--host` | no | Base URL of the playground to check | `http://localhost:5173` |
| `--target` | no | Features package to validate — omit to check the host only | — |
| `--artifact` | no | Artifact to select in the playground | the first one offered |
| `--verbose` | no | Stream browser console output while probing | `false` |
| `--chromium-executable` | no | Launch this chromium binary instead of the bundled download | `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`, else the bundled browser |

Failing checks print the steps to fix them. **Exit code:** `0` if no check failed (warnings are tolerated), `1` otherwise.

### What each check means

| Check | Fails when |
|-------|------------|
| Features package | `--target` cannot be resolved from the cwd, is not `alistigo.type: "features"`, or does not export its directories |
| Feature files | `FEATURES_DIR` is unreadable or holds no `.feature` files — usually an unbuilt package |
| Browsers path | never fails; warns when the configured `PLAYWRIGHT_BROWSERS_PATH` had to be declined (read-only, or wrong revision) or is not writable |
| Browser revision | the browsers directory lacks the chromium revision *this* playwright expects (`pnpm playwright:install`) |
| Chromium executable | `--chromium-executable` / `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE` points at something missing or not executable; warns on a browser major-version skew |
| Host requirements | never fails; warns when `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS` is set, which hides missing-library errors until launch |
| Host reachable | nothing answers on `--host` |
| Playground page | the served HTML lacks the dev-playground markers (warning only) |
| Chromium | Browser binary not downloaded (`pnpm playwright:install`) or OS library missing (`pnpm playwright:install-deps`) |
| Artifact selector | the page has no `Artifact` combobox, so it is not the playground |
| Preview config | the selection never reached the preview iframe's `#alistigo-config` |
| Artifact mount | the iframe body stayed empty — the artifact bundle failed to load |

## Which browser gets launched

Resolved once, in the CLI entrypoint, before anything imports playwright — playwright-core
reads `PLAYWRIGHT_BROWSERS_PATH` once at import time, so it cannot be changed later.

Precedence, highest first:

1. `--chromium-executable`
2. the repo-root `.env` (`ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`, `PLAYWRIGHT_BROWSERS_PATH`)
3. the inherited shell environment
4. playwright's default cache — `${XDG_CACHE_HOME:-~/.cache}/ms-playwright`

The repo `.env` deliberately **overrides** the inherited environment: a value exported
machine-wide is not repo-scoped, and Nx's own dotenv loading runs with `override: false`,
so it can never replace an inherited variable. See `.env.example` at the repo root.

On top of that, a configured browsers path is **declined** when it cannot serve the
installed playwright — it is read-only, or it lacks the required revision while the
default cache has it. The doctor's `Browsers path` check names what was declined and why,
rather than letting it surface as a bare `Executable doesn't exist`.

### Browsers on a nix / non-FHS machine

`playwright-driver.browsers` from nixpkgs exports a machine-wide
`PLAYWRIGHT_BROWSERS_PATH` pointing into `/nix/store`. Two things follow:

- The store path is **read-only**, so `playwright install` blocks on its registry lock
  instead of failing. `pnpm playwright:install` therefore goes through
  `scripts/playwright-install.sh`, which forces a writable directory first.
- Its browser revision tracks *nixpkgs'* playwright, not this repo's, so the revision the
  installed playwright wants is usually absent.

Either install the OS libraries and use the bundled download (identical to CI), or point
the runner at the chromium nix already provides:

```sh
# in .env — no sudo, no download, works offline
ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE=/nix/store/<hash>-playwright-chromium-headless-shell/chrome-headless-shell-linux64/chrome-headless-shell
```

Expect a `Chromium executable` warning when that browser's major version differs from the
one this playwright bundles.

## Troubleshooting

### Chromium fails to launch

Two separate failure classes share the same symptom:

**Binary not downloaded** — Playwright's browser cache (`~/.cache/ms-playwright`) is empty or stale.

```sh
pnpm playwright:install
```

**OS shared library missing** — the binary is present but a system library is absent. Typical error:

```
chrome-headless-shell: error while loading shared libraries: libasound.so.2:
cannot open shared object file: No such file or directory
```

Fix (installs all Chromium system dependencies for your OS):

```sh
pnpm playwright:install-deps
```

Single-package shortcut for the `libasound.so.2` error on Ubuntu 26.04:

```sh
sudo apt-get install -y libasound2t64
```

(The package was renamed from `libasound2` to `libasound2t64` in Ubuntu's time_t 64-bit transition — `libasound2` has no candidate on Ubuntu 26.04+.)

**Why CI reinstalls deps on every run:** the browser binary is cacheable (CI caches `~/.cache/ms-playwright`) but OS system libraries live outside that cache and must be reinstalled each time. `scripts/setup.sh` runs both steps automatically on a fresh clone.

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
6. Add `"@alistigo/<domain>-features": "workspace:*"` to the devDependencies of the artifact package that will run them, then `pnpm install`.
7. Add `test:e2e` / `test:e2e-doctor` targets to that artifact's `project.json`, modelled on `packages/artifact-list/project.json`.
8. Verify the wiring before writing scenarios:
   ```sh
   nx run <artifact>:test:e2e-doctor
   ```

No changes to this runner CLI are required.
