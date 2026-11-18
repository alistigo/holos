# Contract: what a features package provides after this feature

The runner-side contract is unchanged. What changes is the **division of labour**: this is
the checklist a features package is held to once the harness owns the generic half.

## MUST provide

| Item | Form |
|---|---|
| Package type | `"alistigo": { "type": "features", "domain": "<unscoped name minus -features>" }` |
| Feature files | `features/**/*.feature`, copied (not compiled) to the published location |
| Step definitions | compiled to `dist/step-definitions/` |
| Entry exports | `FEATURES_DIR`, `STEP_DEFINITIONS_DIR`, optional `SUPPORT_DIR` as absolute paths |
| Domain locators | its own selector map; roles and accessible names first |
| Domain fixtures | documents, fake plugin bundles, seed data for its domain |

## MAY provide

| Item | When |
|---|---|
| A `World` subclass | it needs domain state across steps; must extend `ArtifactWorld` |
| A `PlaygroundPage` subclass | it needs domain interactions (adding a list row, drawing a shape) |
| A domain tag taxonomy | it has one (`list-features` does; draw-comments uses `@P1`/`@P2`/`@P3` + `@todo`) |

## MUST NOT contain

| Forbidden | Because |
|---|---|
| `BeforeAll` / `AfterAll` browser launch | the harness owns the browser (FR-007, FR-019) |
| `Before` / `After` context and page setup | the harness owns the scenario lifecycle (FR-008) |
| A `World` constructor not derived from `ArtifactWorld` | breaks the shared surface |
| Playground navigation, artifact selection, readiness waiting | the harness owns it (FR-011) |
| Screenshot-on-failure or `@todo` skip hooks | the harness applies them uniformly (FR-013) |
| CDN/plugin route plumbing | the harness owns it (FR-012) |
| A relative path escaping the package (`../../packages/...`) | forbidden by the constitution's `no-cross-package-relative-import` rule |
| Its own Cucumber profile or in-process `test` target | the runner is the only execution path (FR-023) |

## Verification

```sh
# conformance of the manifest
pnpm nx run holos:qa:artifact-arch-check

# the forbidden list, mechanically
grep -rnE "BeforeAll|AfterAll|setWorldConstructor|page\.goto|chromium\.launch" \
  packages/list-features/src packages/artifact-ai-draw-comments-features/src
# → only setWorldConstructor, in a package that subclasses ArtifactWorld
```
