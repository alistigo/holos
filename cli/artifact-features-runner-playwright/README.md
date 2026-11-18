# artifact-features-runner-playwright

A generic Playwright-backed Cucumber runner for Alistigo artifact features packages. Given any `features` package (e.g. `@alistigo/list-features`) and a playground host URL, it dynamically loads the package's Gherkin `.feature` files and step definitions and executes all scenarios against the target host.

The runner is domain-agnostic: it depends on no features package. `--target` is resolved from the **current working directory**, so the package whose `test:e2e` target invokes the runner is the one that declares the features package as a dependency.

It also **owns the shared browser harness** — browser and per-scenario lifecycle, the Cucumber World, the playground page object and CDN route interception — published as a second entry point, `@alistigo/artifact-features-runner-playwright/harness`. A features package carries only its `.feature` files and its domain-specific step definitions. See [The harness](#the-harness).

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
| `--artifact` | no | Artifact to select in the playground before scenarios run | the playground's own default |
| `--chromium-executable` | no | Launch this chromium binary instead of the bundled download | `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`, else the bundled browser |

Omitting `--artifact` leaves the Artifact selector untouched, which is the behaviour every
features package had before the flag existed. Passing a value the playground does not offer
fails before any scenario runs, printing what it does offer.

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

## The harness

Everything generic about driving an artifact in a browser lives here, not in the features
packages. This exists because the alternative is every features package re-implementing the
same browser lifecycle, World and playground navigation — which is exactly what happened
with the first two.

```ts
import {
  ArtifactWorld,
  PlaygroundPage,
  PLATFORM_TEST_IDS,
  installBundleRoute,
  installDefaultRoutes,
} from "@alistigo/artifact-features-runner-playwright/harness";
```

| Export | What it gives you |
|--------|-------------------|
| `ArtifactWorld` | The Cucumber World: `baseUrl`, `artifact`, `browser`, `context`, `page`, `playgroundPage`, `pageErrors`, plus `seedStorage`, `reloadArtifact`, `enablePlugin` |
| `PlaygroundPage` | `open`, `selectArtifact`, `waitForArtifactReady`, `reload`, `enablePlugin`, `fillPluginConfig`, and the `artifactFrame` / `previewFrame` accessors |
| `PLATFORM_TEST_IDS` | The platform DOM contract — `app` (the readiness marker) and `actionPending` |
| `installBundleRoute` | Serve a fixture bundle in place of a package's real fetch |
| `installDefaultRoutes` | What every scenario gets: local builds over jsDelivr, the Claude storage stub, dev-server plugin paths |

Importing the entry point **registers nothing**. The runner separately imports the harness's
registration module and places it **first** in Cucumber's `import` list, ahead of the target
package's step definitions and support files. That order is part of the contract:
`setWorldConstructor` is last-call-wins, so the base World must register before a features
package overrides it with a subclass.

### Entry points

| Specifier | Purpose |
|-----------|---------|
| `@alistigo/artifact-features-runner-playwright` | Library surface (features-package resolution, host validation, check types) |
| `@alistigo/artifact-features-runner-playwright/harness` | The shared harness above |
| `bin` → `dist/cli.js` | The CLI |

Importing `/harness` does not pull in `clipanion` or any argument parsing.

### Breaking-change rules

| Change | Classification |
|--------|----------------|
| Removing or renaming an export | major |
| Adding an optional method or export | minor |
| Changing `PLATFORM_TEST_IDS.app` | major — every artifact and widget must change with it |
| Changing hook registration order | major — silently changes which World wins |

### The readiness marker

`waitForArtifactReady()` waits for `data-testid="alistigo-app"` inside the preview iframe.
Every artifact **and widget** rendered in the playground must expose it on its mounted root.
`@alistigo/list-components-react`'s `AlistigoApp` does this already; `widget`-type packages
must add it themselves even though they are otherwise exempt from the Artifact Contract —
without it the harness has no way to tell "mounted and interactive" from "still loading", and
every scenario hangs.

### Which bundle the preview actually loads

`installDefaultRoutes` intercepts `https://cdn.jsdelivr.net/npm/@alistigo/**`, resolves the
package in the workspace, and serves its local `dist/` build. **This matters more than it
sounds.** A `vite preview` build is not a dev build, so the playground's `resolveScriptUrl`
falls through to the registry's CDN URL — without interception, `test:e2e` asserts against the
*published* artifact and any source-only change looks absent.

A package with no local build falls through to the network rather than failing; `doctor`'s
`Local bundle` check is what tells you that happened.

One request is deliberately **not** intercepted: `html-to-image` from cdnjs, which the
draw-comments widget needs for its snapshot. The playground loads it under an `integrity`
hash for the minified build, and npm ships only the unminified one, so no local substitute
survives the browser's SRI check. Scenarios that send an annotation therefore reach cdnjs;
everything else in a run is served locally.

### `@todo` scenarios

Scenarios tagged `@todo` are filtered out of the run. The harness also carries a `Before` hook
that marks them skipped, which would keep them visible in the report — but Cucumber resolves
step definitions *before* hooks run, so a `@todo` scenario whose steps were never written is
reported `undefined` regardless, and `failFast` then aborts the suite. `list-features`' `@todo`
posthog feature is in exactly that state. Until those step definitions exist, filtering is the
only way such a scenario neither fails nor aborts the run.

## Features package contract

A valid `--target` package must:

1. Declare `"alistigo": { "type": "features", "domain": "<domain>" }` in its `package.json`,
   where `domain` is the unscoped package name minus the `-features` suffix.
2. Export `FEATURES_DIR` — absolute path to the directory containing `.feature` files.
3. Export `STEP_DEFINITIONS_DIR` — absolute path to the compiled step definition files.
4. Optionally export `SUPPORT_DIR` — absolute path to compiled **domain** support code (a
   `World` subclass and a `PlaygroundPage` subclass). The generic lifecycle is the harness's.

### What stays in a features package, and what does not

| Must provide | Must NOT contain |
|---|---|
| `.feature` files | `BeforeAll` / `AfterAll` browser launch |
| Compiled step definitions | `Before` / `After` context and page setup |
| `FEATURES_DIR` / `STEP_DEFINITIONS_DIR` exports | A `World` not derived from `ArtifactWorld` |
| Domain locators (roles and accessible names first) | Playground navigation or readiness waiting |
| Domain fixtures (documents, fake plugin bundles) | Screenshot-on-failure or `@todo` skip hooks |
| Optionally: a `World` / `PlaygroundPage` subclass | CDN or plugin route plumbing |
| | Its own Cucumber profile or in-process `test` target |
| | A relative path escaping the package (`../../packages/...`) |

Checked mechanically:

```sh
grep -rnE "BeforeAll|AfterAll|chromium\.launch|page\.goto" packages/*-features/src
# -> no output
```

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
4. Write step definitions in `src/step-definitions/`, and any domain `World` /
   `PlaygroundPage` subclass in `src/support/` — no lifecycle hooks of your own.
5. Export `FEATURES_DIR`, `STEP_DEFINITIONS_DIR`, and `SUPPORT_DIR` from `src/index.ts`.
   Set `"types": ["bun"]` in `tsconfig.json`: the Nx build runs from the workspace root, and
   a bare `["node"]` only resolves from the package's own `node_modules`.
6. Add `"@alistigo/<domain>-features": "workspace:*"` to the devDependencies of the artifact package that will run them, then `pnpm install`.
7. Add `test:e2e` / `test:e2e-attach` / `test:e2e-doctor` targets to that artifact's
   `project.json`, modelled on `packages/artifact-ai-draw-comments/project.json`. Pass
   `--artifact` if the playground should select a specific artifact, and make the artifact's
   **own build** a `dependsOn` — the harness serves that local build over the CDN URL.
8. Verify the wiring before writing scenarios:
   ```sh
   nx run <artifact>:test:e2e-doctor
   ```

No changes to this runner CLI are required.
