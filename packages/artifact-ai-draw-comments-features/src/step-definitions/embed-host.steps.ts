import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type { DrawCommentsWorld } from "../support/world.js";

/**
 * Steps for the widget's embedded nature.
 *
 * The script-tag mount scenario is tagged `@todo`: it needs a bare host
 * document with the bundle in a `<script>` tag, which the playground does not
 * provide — it injects the artifact as a module. The runner skips `@todo`
 * before creating a browser context, so these two steps never execute; they
 * exist so the scenario's vocabulary stays defined.
 */

Given(
  "a host artifact that has included the ai-draw-comments bundle via script tag",
  function (this: DrawCommentsWorld) {
    return "pending";
  },
);

When("the host artifact loads", function (this: DrawCommentsWorld) {
  return "pending";
});

Then(
  'the "Draw Comment" button is visible at the top of the host artifact UI',
  function (this: DrawCommentsWorld) {
    return "pending";
  },
);

When(
  "the user completes a draw comment cycle selecting a region of the host content",
  async function (this: DrawCommentsWorld) {
    // The region in DEFAULT_REGION lies over the host surface's prose, so the
    // cycle genuinely annotates host content rather than empty space.
    assert.ok(
      await this.widget.hostSurface.isVisible(),
      "host content must be present before annotating it",
    );
    await this.completeCycle("see this region");
  },
);

Then(
  "the host artifact content was visible beneath the overlay throughout",
  async function (this: DrawCommentsWorld) {
    // The overlay is transparent and the canvas sits above the host content
    // without replacing it, so the host surface is still rendered afterwards.
    assert.ok(
      await this.widget.hostSurface.isVisible(),
      "the host content must remain visible beneath the annotation overlay",
    );
  },
);
