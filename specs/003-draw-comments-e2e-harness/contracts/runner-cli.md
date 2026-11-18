# Contract: `artifact-features-runner-playwright` CLI

Only the additions and changes this feature makes are listed; everything else is as
feature 002 shipped it.

## `run` (default command)

| Flag | Required | Default | Change |
|---|---|---|---|
| `--target` | yes | — | unchanged |
| `--host` | no | `http://localhost:5173` | unchanged |
| `--chromium-executable` | no | env / bundled | unchanged |
| `--artifact` | no | playground's own default | **new** (F5) — the artifact to select in the playground before scenarios run |

**`--artifact` semantics**

- Omitted → the harness does not touch the Artifact selector; the playground's default
  artifact is used. This preserves today's `list-features` behaviour exactly (FR-033).
- Provided → the harness selects it, awaits the preview iframe's renavigation, then waits
  for readiness. A value the playground does not offer fails before any scenario runs, with
  the offered list printed.
- Passed to the harness through `ARTIFACT_FEATURES_ARTIFACT`, alongside the existing
  `PLAYWRIGHT_BASE_URL` and `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE`.

**Environment the `run` command sets for the harness**

| Variable | Value |
|---|---|
| `PLAYWRIGHT_BASE_URL` | `--host` |
| `ARTIFACT_FEATURES_ARTIFACT` | `--artifact`, when given |
| `ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE` | resolved chromium, when not the bundled one |

**Cucumber configuration produced** (order significant — see the harness contract):

```text
paths:  <FEATURES_DIR>/**/*.feature
import: <harness registration module>
        <STEP_DEFINITIONS_DIR>/**/*.js
        <SUPPORT_DIR>/**/*.js        (when exported)
format: @cucumber/pretty-formatter
tags:   not @todo
failFast: true
```

**Exit codes**: unchanged — `0` all scenarios pass, `1` any failure or an invalid target.

## `doctor`

| Flag | Change |
|---|---|
| `--artifact` | unchanged in meaning, now shared with `run` |

One check is added:

| Check | Fails when | Warns when |
|---|---|---|
| **Local bundle** | — | the selected artifact has no local `dist/` build, so the preview will fetch the published bundle from jsDelivr instead of the working tree (F1) |

It warns rather than fails so `doctor` stays usable against a published deployment.

## Nx targets added to `artifact-ai-draw-comments`

| Target | Shape |
|---|---|
| `test:e2e` | builds playground + runner + features package, starts `vite preview`, polls `http://localhost:4173`, runs with `--target=@alistigo/artifact-ai-draw-comments-features --artifact=@alistigo/artifact-ai-draw-comments --host=http://localhost:4173`, tears down, propagates status |
| `test:e2e-attach` | same run command against an already-running playground |
| `test:e2e-doctor` | `doctor` with the same `--target` / `--artifact` |

All three live in `project.json` only (FR-032). The runner is invoked as
`bun ../../cli/artifact-features-runner-playwright/dist/cli.js` — never `pnpm <bin>`,
because pnpm's bin symlinks require `dist/` to exist at install time, which it does not in CI.

`test:e2e` additionally depends on the **widget's own build**, since the harness now serves
the local bundle over the CDN URL (F1).
