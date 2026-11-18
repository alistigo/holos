# Quickstart: validating the draw-comments end-to-end harness

**Feature**: `specs/003-draw-comments-e2e-harness` | **Date**: 2026-11-17

Run these in order. Steps 1 and 6 are the regression guard for `list-features`: step 1
records the baseline **before** any change, step 6 compares against it. Do step 1 first.

## Prerequisites

```sh
mise run setup                  # or: pnpm install
pnpm playwright:install         # once; see the runner README for nix/non-FHS hosts
```

On a host that cannot run the bundled download, set
`ARTIFACT_FEATURES_CHROMIUM_EXECUTABLE` in the repo-root `.env` — the runner's README
documents the precedence, and `doctor` names what it declined.

---

## Step 1 — Record the list baseline (before any change)

```sh
pnpm nx run artifact-list:test:e2e 2>&1 | tee /tmp/list-e2e-before.txt
grep -E "scenarios?|steps?" /tmp/list-e2e-before.txt | tail -5
```

**Expected**: a pass count, e.g. `10 scenarios (10 passed)`. Write the number down — it is
the acceptance threshold for SC-006 and the only way to detect what F1 changes (the list
suite stops testing the published bundle and starts testing the working tree).

---

## Step 2 — The harness is one module, registering one browser

```sh
pnpm nx run artifact-features-runner-playwright:build
pnpm nx run list-features:build
cd packages/artifact-list
HEADED=0 bun ../../cli/artifact-features-runner-playwright/dist/cli.js \
  --target=@alistigo/list-features --host=http://localhost:4173 2>&1 | head -30
```

**Expected**: scenarios run. **Failure mode to watch for**: two browser launches, or
`World constructor` registered twice — the symptom of the harness being loaded as two module
instances (research D2). If that happens, apply D2's fallback: have the runner import the
harness through the same bare specifier it hands Cucumber.

---

## Step 3 — The widget is selectable and mounts in the playground

**Exercise both modes.** They resolve the artifact bundle by entirely different paths, and a
break in one is invisible from the other:

| Mode | How the iframe gets the artifact | What only this mode can catch |
|---|---|---|
| `dev` | Vite serves the aliased **source**, so the playground's Lingui plugin transforms the artifact's own `.po` | a catalog the plugin's config does not declare (500 on `messages.po`), HMR-only breakage |
| `preview` | the registry's CDN URL, route-served from the local `dist/` by the harness | what `test:e2e` actually asserts against |

Skipping `dev` is how the Lingui catalog defect (T073) reached a merge-ready branch: every
assertion below passed under `preview`.

```sh
pnpm nx run alistigo-artifact-playground:dev     # http://localhost:5173
```

**Load the page once and let it settle before asserting anything.** On a cold start Vite
discovers dependencies and logs `optimized dependencies changed. reloading` — twice, in
practice — and each is a full-page reload that detaches the preview iframe mid-interaction.
By hand this is invisible; a script that selects the artifact and immediately queries the
frame will fail on a detached frame and look like a mount bug. `vite preview` has no
dependency-optimization step, so this is dev-only.

In a browser:

1. The `Artifact` selector offers `@alistigo/artifact-ai-draw-comments`.
2. Selecting it reloads the preview; the host surface prose renders, with the
   "Draw Comment" button above it.
3. `AI Context` = `claude` → the button is **enabled**.
4. `AI Context` = `none` → the button is **disabled**, a "window.claude is not available"
   banner shows, and no uncaught error appears in the console (FR-003).
5. Switch back to `@alistigo/artifact-list` → it mounts normally (FR-005).

6. The widget's controls carry **English accessible names**, not Lingui hash ids — a missing
   or unresolvable catalog shows up as `aria-label="TzVdRJ"` rather than as an error.

**Then the full cycle (FR-004)**: click "Draw Comment", drag a region over the host prose,
draw a rectangle, type a comment, click "Send".

**Expected**: the annotation image appears in the thread with the comment under it, then the
simulator's canned response below that. The `Claude Simulator` tab shows one logged request.
**Failure mode this catches**: F3 — before the prompt is normalised, the *host page* (not the
iframe) dies with "Objects are not valid as a React child" at this exact point.

**Now repeat the whole step against `preview`** (`nx run alistigo-artifact-playground:preview`,
port 4173), which is what `test:e2e` drives.

---

## Step 4 — Doctor reports the whole chain green

```sh
pnpm nx run artifact-ai-draw-comments:test:e2e-doctor
```

**Expected**: every check OK (SC-007), including `Artifact selector` selecting
`@alistigo/artifact-ai-draw-comments`, `Preview config` reporting it, and `Artifact mount`.
The new `Local bundle` check should be OK, not a warning — a warning means the preview would
fetch the published bundle from jsDelivr and the readiness marker added by this feature
would be missing (F1).

---

## Step 5 — The draw-comments suite runs end to end

```sh
pnpm nx run artifact-ai-draw-comments:test:e2e
```

**Expected**: `13 scenarios (12 passed, 1 skipped)` and exit `0` — SC-003 exactly. The
skipped one is `embed-host`'s script-tag mount, retagged `@todo` (FR-027).

**Then prove the failure path (SC-009)**: change the "Draw Comment" button's `aria-label`
in `packages/artifact-ai-draw-comments/src/components/DrawCommentButton.tsx`, rebuild, re-run.

**Expected**: a named failing scenario with a screenshot attached, and exit `1` — not a bare
timeout. Revert.

---

## Step 6 — The list suite has not regressed

```sh
pnpm nx run artifact-list:test:e2e 2>&1 | tee /tmp/list-e2e-after.txt
diff <(grep -cE "^\s*(✔|✓)" /tmp/list-e2e-before.txt) \
     <(grep -cE "^\s*(✔|✓)" /tmp/list-e2e-after.txt)
```

**Expected**: identical pass counts (SC-006). A drop here is the F1 risk materialising — a
local `artifact-list` regression that the published bundle was masking. Investigate before
proceeding; do not rebase the baseline.

```sh
pnpm nx run artifact-list:test:e2e-attach   # against a running playground
pnpm nx run artifact-list:test:e2e-doctor
```

**Expected**: both still work unchanged (FR-033).

---

## Step 7 — Neither features package still carries the harness

```sh
grep -rnE "BeforeAll|AfterAll|chromium\.launch|page\.goto" \
  packages/list-features/src packages/artifact-ai-draw-comments-features/src
```

**Expected**: no output (FR-019, SC-004).

```sh
grep -rn "setWorldConstructor" packages/*/src
```

**Expected**: only in packages that subclass `ArtifactWorld`, never a bare `World`.

```sh
grep -rn '\.\./\.\./\.\./\.\.' packages/list-features/src
```

**Expected**: no output — the cross-package relative read of `local-storage-plugin/dist`
is gone (research D3).

---

## Step 8 — Conformance and publishability

```sh
pnpm nx run holos:qa:artifact-arch-check
```

**Expected**: both features packages reported conformant, no `features/*` violations (SC-008).

```sh
pnpm -F @alistigo/list-features pack --pack-destination /tmp
pnpm -F @alistigo/artifact-ai-draw-comments-features pack --pack-destination /tmp
pnpm -F @alistigo/artifact-features-runner-playwright pack --pack-destination /tmp
tar -tzf /tmp/alistigo-artifact-ai-draw-comments-features-*.tgz | head
```

**Expected**: three tarballs; the features one contains both `dist/` and `features/`
(SC-010). The runner tarball contains `dist/harness/`.

```sh
pnpm biome check --write .
pnpm nx run holos:qa
```

**Expected**: all gates pass (SC-008). Stage any files Biome auto-fixed in the same commit.

---

## Step 9 — Adding a third features package needs no harness code

Not run as part of this feature; the check is a read. Open
`specs/003-draw-comments-e2e-harness/contracts/features-package.md` and confirm the
"MUST provide" column names only `.feature` files, step definitions, exports, domain
locators and domain fixtures (SC-005).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every scenario times out on readiness | the preview is serving the published bundle, which lacks `data-testid="alistigo-app"` | build the widget; check `doctor`'s `Local bundle` |
| Host page goes blank when Send is clicked | F3, prompt not normalised | fix the simulator's prompt handling |
| Canvas not over the selected region | F2b, double offset in `DrawCanvas` | remove the duplicated `left`/`top` |
| `htmlToImage is undefined` | `aiContext` is not `claude`, or the cdnjs route is not served | run in the Claude context; check the harness's `html-to-image` route (F4) |
| Two browsers launch | harness loaded twice | research D2 fallback |
| 500 on `messages.po?import` in dev | the playground's Lingui config does not declare that artifact's catalog | add it to `apps/alistigo-artifact-playground/lingui.config.ts` |
| A scenario runs against the wrong artifact | every artifact exposes the same readiness marker, so a stale `framenavigated` can satisfy the wait | `selectArtifact` polls the iframe's `#alistigo-config` until it reports the requested app |
| In dev, the artifact mounts then the frame goes blank or detaches | Vite's cold-start `optimized dependencies changed. reloading` | load the page once and wait before asserting; see step 3 |
| Region selection does nothing | the drag was under 20×20 px | the overlay enforces a minimum; drag a larger area |
