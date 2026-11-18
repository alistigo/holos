import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type { DrawCommentsWorld } from "../support/world.js";

/**
 * Steps for reading Claude's response.
 *
 * Note on the widget's actual behaviour: `doSend` awaits both the snapshot and
 * Claude's answer before dispatching `AnnotationSent` and `ClaudeResponded`
 * together, so the intermediate "sent, awaiting response" state (the thread's
 * "Claude is thinking…" branch) is never reachable through the UI. These steps
 * therefore assert the end state rather than that intermediate one.
 */

Given(
  "a draw comment has been sent via window.claude.complete",
  async function (this: DrawCommentsWorld) {
    await this.drawOneShape();
    this.comment = "Look at this area";
    await this.widget.typeComment(this.comment);
    await this.widget.send();
    this.annotationImageSrc = await this.widget.waitForAnnotationImage();
  },
);

When("Claude answers", async function (this: DrawCommentsWorld) {
  this.claudeResponse = await this.widget.waitForResponse();
});

Then(
  "Claude's response text appears below the annotation display area",
  async function (this: DrawCommentsWorld) {
    assert.ok(this.claudeResponse.length > 0, "Claude's response never rendered");

    // "Below" is positional, not incidental: the response must sit under the image.
    const image = await this.widget.annotationImage.boundingBox();
    const response = await this.widget.artifactFrame
      .locator("p.whitespace-pre-wrap")
      .first()
      .boundingBox();
    assert.ok(image !== null && response !== null, "image or response has no bounding box");
    assert.ok(
      response.y >= image.y,
      `response (y=${Math.round(response.y)}) must render below the annotation (y=${Math.round(image.y)})`,
    );
  },
);

Then("the artifact has not reloaded", async function (this: DrawCommentsWorld) {
  // A marker stamped on the preview window at load time; a reload would wipe it.
  assert.ok(
    await this.widget.loadMarkerSurvived(),
    "the preview document reloaded during the send",
  );
});

Given(
  "Claude's response is displayed below the annotation",
  async function (this: DrawCommentsWorld) {
    await this.completeCycle();
    assert.ok(this.claudeResponse.length > 0, "Claude's response never rendered");
  },
);

When("the user reads the response", function (this: DrawCommentsWorld) {
  // Reading changes nothing; the assertions inspect what is on screen.
});

Then(
  "the annotated PNG is still visible above the response",
  async function (this: DrawCommentsWorld) {
    assert.ok(await this.widget.annotationImage.isVisible(), "annotation image no longer visible");
    const src = await this.widget.annotationImage.getAttribute("src");
    assert.ok(
      src?.startsWith("data:image/png;base64,") === true && src.length > 200,
      "annotation image lost its PNG data",
    );
  },
);

Then(
  "the original comment is still visible above the response",
  async function (this: DrawCommentsWorld) {
    assert.ok(
      await this.widget.artifactFrame.getByText(this.comment, { exact: true }).first().isVisible(),
      `the comment "${this.comment}" is no longer visible`,
    );
  },
);

When("the user looks at the top of the artifact", function (this: DrawCommentsWorld) {
  // No interaction; the assertion inspects the button's state.
});

Then(
  'the "Draw Comment" button is active and can be clicked to start a new annotation',
  async function (this: DrawCommentsWorld) {
    assert.ok(
      await this.widget.drawCommentButton.isEnabled(),
      "Draw Comment must be clickable again once Claude has responded",
    );
    // Prove it actually starts a new session, not just that it looks enabled.
    await this.widget.startAnnotation();
    assert.ok(
      await this.widget.selectionOverlay.isVisible(),
      "clicking Draw Comment did not start a new annotation",
    );
  },
);
