# Quickstart: Validating Playground State Persistence & Source Tabs

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-18

How to prove this feature works. Details of the rules live in
[contracts/](./contracts/); this file is the run guide.

## Prerequisites

```sh
mise run setup                 # once, on a fresh machine
pnpm install
pnpm nx run-many -t build      # the playground loads plugins from workspace builds
```

For the end-to-end suites only:

```sh
pnpm playwright:install        # chromium; see the Playwright notes in the repo .env
```

## 1. Automated checks

```sh
# Pure-module tests: persistence, address parameters, segment invariants
pnpm nx run alistigo-artifact-playground:test

# Types and lint
pnpm nx run alistigo-artifact-playground:typecheck
pnpm biome check --write .

# Full gate set (what CI runs)
pnpm nx run holos:qa
```

**Expected**: all green. The segment test is the one that matters most — it asserts the assembled
srcdoc is byte-identical to the pre-refactor output (S-1) and that the segments partition it
(S-2, S-3). If S-1 fails, stop: the end-to-end suites will fail too.

## 2. The end-to-end regression guard (FR-019)

Run the existing suites **unchanged**. Each `test:e2e` target starts its own `vite preview`
through `scripts/run-e2e-suite.sh` on its own port (4173 list, 4174 draw-comments), so the
playground must be built first and there is no second terminal to manage. Running both at once is
supported and is what CI does.

```sh
# Record the baseline BEFORE touching the playground, on a clean checkout
pnpm nx run alistigo-artifact-playground:build
pnpm nx run artifact-list:test:e2e 2>&1 | tee /tmp/004-list-e2e-before.txt
pnpm nx run artifact-ai-draw-comments:test:e2e 2>&1 | tee /tmp/004-draw-e2e-before.txt
grep -E "scenarios?|steps?" /tmp/004-*-before.txt | tail -6
```

```sh
# After the change — same two commands, same playground build step
pnpm nx run alistigo-artifact-playground:build
pnpm nx run artifact-list:test:e2e
pnpm nx run artifact-ai-draw-comments:test:e2e
```

**Expected**: the same scenario pass counts as the recorded baseline, with no edits to any
`.feature` file or step definition. Record the baseline first — without it, a pre-existing
failure is indistinguishable from one this feature caused.

Note what `vite preview` implies: the suites run a **production** build, where
`import.meta.env.DEV` is false, the *Source* field is not rendered and the artifact comes from
the registry URL (route-intercepted by the harness). So `modeSelectable` is false there, the
`source` parameter is inert, and the persistence path the suites exercise is the one covering
artifact, language, read-only, document, plugins, AI context and published. Three results deserve a specific look, per [research.md](./research.md) R10:

| What to check | Why |
|---|---|
| the `@artifact-plugins` scenarios in `list-features` | they tick a plugin checkbox and then reload; plugin selections now survive that reload |
| draw-comments' *"Reloading the artifact discards an in-progress annotation"* | the comment in `world.ts` names it as the guard for reload-then-reselect, the one ordering this change actually alters |
| any scenario using `Given a list:` | it seeds storage, which clears the playground's own key as a side effect, and must still come back on the right artifact |

If a plugin scenario fails, compare against the baseline files recorded above before assuming
this feature caused it. `pnpm nx run artifact-list:test:e2e-doctor` diagnoses a harness or
playground mismatch without running the scenarios.

## 3. Form persistence by hand (User Story 1)

```sh
pnpm nx run alistigo-artifact-playground:dev
```

Then, in the browser:

1. Change **every** field of the left `Config` tab: Source, AI Context, Artifact, Language,
   Read-only, a plugin (tick it and edit its config JSON), and Document.
2. Reload the page (F5).
3. **Expected**: every field shows what you chose, and the preview boots that artifact with that
   configuration, untouched (FR-001 → FR-003).
4. Pick the raw-markdown document option, type some markdown, reload.
   **Expected**: the option and the text are both still there.
5. Open DevTools → Application → Local Storage.
   **Expected**: one key, `dev-playground:config:v1`, holding `{"v":1,"config":{…}}`.
6. Switch the left panel to **Storage**.
   **Expected**: the playground's own key is **not** listed among the artifact entries (FR-006).
7. Corrupt the value by hand (e.g. set it to `{"v":99}` or to `not json`) and reload.
   **Expected**: the playground opens on its defaults, with no error and no blank screen (FR-005).
8. Set `app` inside the stored JSON to `"@alistigo/does-not-exist"`, leave the other fields valid,
   and reload.
   **Expected**: the artifact falls back to the default while your language, read-only and
   document choices survive (FR-004).
9. Open the playground in a private window.
   **Expected**: it works; it simply remembers nothing.
10. Back in the normal window: with a setup in place, press **Clear Data** in the Claude Simulator
    panel, then reload the page.
    **Expected**: the artifact's data is gone but every form field is exactly as you left it
    (FR-022). Check `dev-playground:config:v1` is still present in DevTools after the clear — the
    iframe is same-origin, so the clear reaches the playground's own key and the setup is only
    intact because it is written back (research R11).

## 4. Address parameters by hand (User Story 2)

With the dev server running:

| Open | Expect |
|------|--------|
| `?artifact=@alistigo/artifact-list` | the Artifact field shows it and the preview boots it |
| `?artifact=list` | the same — the short form resolves |
| `?source=prod-local` | the Source field shows *prod local* and the artifact loads from the local build |
| `?artifact=list&source=dev` | both applied |
| `?artifact=nope` | ignored; the stored or default artifact is used, page fully functional (FR-010) |

Then:

1. Save a setup with artifact **A** (select it, reload once to confirm it persisted).
2. Open `?artifact=<B>`.
   **Expected**: B is selected, and every other field still shows your saved values (FR-009).
3. With that address still in the bar, select artifact **C** in the form.
   **Expected**: the form and preview follow C and stay on C — the address does not pull it back
   to B (FR-011). Reload (same URL) and B returns, which is correct: the address is read on load.

## 5. The new tabs (User Story 3)

In the preview panel on the right:

1. **Expected tab row**: `App`, `Source`, `AI Bridge`, `Artifact source`, `Playground source`,
   `Config`, `AI Input` — the four code views grouped, and the original four unchanged in name,
   relative order and behaviour (FR-012). At phone-ish panel widths the row wraps rather than
   clipping or scrolling a tab out of reach.
2. With **AI Context = claude**, open **AI Bridge**.
   **Expected**: only the bridge code — the `html-to-image` tag, the claude-artifact-api inject
   script, and (when *Published* is on) the `claudeArtifactStatus` line — syntax-coloured, with a
   working Copy button (FR-013, FR-016).
3. Set **AI Context = none**.
   **Expected**: AI Bridge says this context injects no bridge code; it is not blank and not stale.
4. Open **Artifact source**.
   **Expected**: the artifact's `<script type="module" src=…>` and nothing else — no bridge, no
   `alistigo-config`, no `ai-input-action` (FR-014). Switch Source between *dev* and *prod local*
   and watch the URL in it change (FR-018).
5. Open **Playground source**.
   **Expected**: the host scaffolding — doctype, console shim, CSP and meta tags, title, and in dev
   the plugin-override and React-refresh scripts (FR-015).
6. Open **Source** and compare.
   **Expected**: everything in the three new tabs appears there, plus the config and AI-input
   script tags that the Config and AI Input tabs present in readable form (FR-023); nothing appears
   twice (FR-017 — the automated check in §1 is the authoritative one).
7. Press **Copy** on each of AI Bridge, Artifact source, Playground source and Source, pasting each
   into a scratch buffer.
   **Expected**: each copies its own content and flashes *Copied!* (FR-016). The playground on
   `localhost` is a secure context, so the clipboard is available here; the guard added in T030 is
   for the case where it is not, and the button must simply do nothing rather than break the panel.
8. Select the draw-comments artifact.
   **Expected**: its host-surface `<article>` shows under **Playground source**, not under
   Artifact source.

## Done when

- [ ] `pnpm nx run alistigo-artifact-playground:test` passes, including the byte-identity test
- [ ] `pnpm nx run holos:qa` passes (lint, arch, dead-code, stories, sandbox)
- [ ] both end-to-end suites pass unchanged, with the three focus results in §2 checked
- [ ] §3 walkthrough passes, including the corrupted-value, private-window and Clear Data cases
- [ ] §4 table passes, including the precedence pair (steps 2 and 3)
- [ ] §5 walkthrough passes for both AI contexts
