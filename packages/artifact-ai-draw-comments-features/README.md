# @alistigo/artifact-ai-draw-comments-features

Gherkin behaviour specifications for `@alistigo/artifact-ai-draw-comments`, the embeddable
draw-comment widget. These `.feature` files are the source of truth for what the widget
should do; the runner reads them and asserts conformance against the real widget in a
browser.

## How the scenarios run

They run **in a browser, against the dev playground**, through the generic runner — not in
process against the domain layer.

```sh
nx run artifact-ai-draw-comments:test:e2e          # boots the playground, runs, tears down
nx run artifact-ai-draw-comments:test:e2e-attach   # against an already-running playground
nx run artifact-ai-draw-comments:test:e2e-doctor   # diagnose the chain before blaming a scenario
```

This package has no `test` target and no Cucumber profile of its own: the runner is the only
execution path, which is what keeps one way of running the specs rather than two.

## What is in here

| Path | Contents |
|------|----------|
| `features/` | The `.feature` files — 14 scenarios across 3 features |
| `src/step-definitions/` | Step implementations, driving the widget's UI |
| `src/support/selectors.ts` | The widget's roles, accessible names and test ids |
| `src/support/draw-comments.page.ts` | `DrawCommentsPage extends PlaygroundPage` — drag, draw, send, read back |
| `src/support/world.ts` | `DrawCommentsWorld extends ArtifactWorld` — per-scenario domain state |
| `src/index.ts` | The three directories the runner reads |

## What is deliberately **not** in here

The browser lifecycle, the Cucumber World base class, the playground page object, CDN route
interception, screenshot-on-failure and `@todo` skip handling all live in
`@alistigo/artifact-features-runner-playwright/harness`. Every features package shares one
copy; see that package's README for the full division of labour.

## Locator policy

Roles and accessible names first — every control in the widget carries an `aria-label` from a
Lingui `t` macro. Test ids appear only where ARIA deliberately cannot reach:

- the selection overlay and its drag indicator are `role="presentation"`, i.e. removed from
  the accessibility tree on purpose;
- the drawing panel and the region wrapper are layout containers with no role.

If a control cannot be located by role and name, the fix is usually to give it an accessible
name, not to add a test id.

## The host surface

The widget is an *overlay*: it prepends itself to a host page and expects content behind it to
annotate. The playground injects a static stand-in — a heading and two paragraphs tagged
`data-testid="draw-comments-host-surface"` — into the preview iframe's srcdoc, so scenarios
have real content to select a region over. Without it, "the host content remains visible
behind the canvas" would have nothing to be true of.

## Known gap: the annotated PNG does not capture host content

`buildAnnotatedSnapshot` captures `regionEl` — the wrapper div that contains only the Konva
canvas. Nothing of the host page behind the region is in that subtree, so the composite PNG
carries the drawn shapes on a transparent background, **not** the host content they were
drawn over.

No scenario here asserts the PNG's pixels, for that reason. `embed-host`'s second scenario
asserts that the annotation image reaches the conversation and that the host content stayed
visible beneath the overlay — both of which hold — and stops there.

This is recorded rather than hidden: a green suite should not imply the capture is correct.
Fixing it means changing *what the widget screenshots*, which is a behavioural change to its
output and deserves its own spec. See the follow-up issue linked from
`specs/003-draw-comments-e2e-harness/research.md` (finding F6).

## One scenario is excluded, not skipped

`embed-host`'s "Draw Comment button appears in a host artifact on load" is tagged `@todo`. It
needs a bare host document with the bundle in a `<script>` tag, which the playground does not
provide — it injects artifacts as modules.

The runner **filters** `@todo` scenarios out of the run rather than reporting them skipped,
and then reports the count it left out:

```text
13 scenarios (13 passed)
60 steps (60 passed)

1 scenario excluded by @todo (not yet implemented; see the feature files).
```

So Cucumber's totals cover the 13 that ran, and the line below them accounts for the
fourteenth. The reason it is filtered rather than skipped is in the runner's README: Cucumber
resolves step definitions before hooks run, so making `@todo` scenarios appear as skipped
would surface `list-features`' unimplemented posthog feature as `undefined` and abort that
suite. Between the tag in the `.feature` file and that count, the scenario is recorded in
both the specs and every run's output.

## Tags

| Tag | Meaning |
|-----|---------|
| `@P1` | Core annotate-and-send journey |
| `@P2` | Reading Claude's response |
| `@P3` | Embedding in a host artifact |
| `@todo` | Not yet implementable; filtered out of the run |

## Editing the specs

```sh
nx run artifact-ai-draw-comments-features:format        # prettier-plugin-gherkin + biome
nx run artifact-ai-draw-comments-features:qa:lint       # gherklin + biome
nx run artifact-ai-draw-comments-features:build         # compile step definitions
```

Write or reword the scenario first and watch it fail, then make it pass — the feature file is
the specification, and the widget conforms to it.
