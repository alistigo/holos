import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import type { DrawCommentsWorld } from "../support/world.js";

/**
 * Steps for annotating and sending, driven entirely through the widget's UI in
 * the dev playground. Each Then asserts something the user can observe: a
 * control's visibility or enabled state, an element's presence, or the geometry
 * of the overlay against the region that was dragged.
 */

Given(
  "the draw comment widget is loaded over a host artifact",
  async function (this: DrawCommentsWorld) {
    // The harness already opened the playground with this artifact selected and
    // waited for the readiness marker. Confirm the host content is behind us.
    assert.ok(
      await this.widget.hostSurface.isVisible(),
      "the playground's host surface must be visible for the widget to annotate",
    );
    await this.widget.stampLoadMarker();
  },
);

When("the user views the artifact", async function (this: DrawCommentsWorld) {
  // No interaction — the assertion inspects the state already on screen.
});

Then(
  'the "Draw Comment" button is visible at the top of the artifact',
  async function (this: DrawCommentsWorld) {
    assert.ok(await this.widget.drawCommentButton.isVisible(), "Draw Comment button not visible");
    assert.ok(
      await this.widget.drawCommentButton.isEnabled(),
      "Draw Comment button must be enabled in a Claude context",
    );
  },
);

When('the user clicks the "Draw Comment" button', async function (this: DrawCommentsWorld) {
  await this.widget.startAnnotation();
});

Then("a crosshair selection overlay covers the artifact", async function (this: DrawCommentsWorld) {
  const overlay = this.widget.selectionOverlay;
  assert.ok(await overlay.isVisible(), "selection overlay not visible");
  const className = (await overlay.getAttribute("class")) ?? "";
  assert.ok(
    className.includes("cursor-crosshair"),
    `overlay must present a crosshair cursor; class was "${className}"`,
  );
});

Then(
  'the "Draw Comment" button is disabled while the session is active',
  async function (this: DrawCommentsWorld) {
    assert.equal(
      await this.widget.drawCommentButton.isEnabled(),
      false,
      "Draw Comment must be disabled while an annotation is in progress",
    );
  },
);

Given("selection mode is active", async function (this: DrawCommentsWorld) {
  await this.widget.startAnnotation();
});

When(
  "the user click-drags across a region of the artifact",
  async function (this: DrawCommentsWorld) {
    // Hold the drag so the in-progress indicator can be observed before release.
    await this.widget.beginRegionDrag(this.region);
  },
);

Then(
  "a rectangular selection indicator is shown over that region",
  async function (this: DrawCommentsWorld) {
    const indicator = this.widget.selectionIndicator;
    assert.ok(await indicator.isVisible(), "no selection indicator while dragging");
    const box = await indicator.boundingBox();
    assert.ok(box !== null, "selection indicator has no bounding box");
    assert.ok(
      Math.abs(box.width - this.region.width) < 8 && Math.abs(box.height - this.region.height) < 8,
      `indicator ${Math.round(box.width)}x${Math.round(box.height)} should match the dragged ` +
        `${this.region.width}x${this.region.height}`,
    );
    await this.widget.releaseRegionDrag();
  },
);

When("the user confirms a region by releasing the drag", async function (this: DrawCommentsWorld) {
  await this.widget.dragRegion(this.region);
});

Then(
  "a drawing canvas overlay appears on top of the selected region",
  async function (this: DrawCommentsWorld) {
    await this.widget.waitForCanvas();
    const canvas = await this.widget.canvasBox();
    assert.ok(canvas !== null, "canvas has no bounding box");

    // The canvas must sit ON the region the user selected. A duplicated offset
    // between the region wrapper and the canvas wrapper put it at twice the
    // offset, which this tolerance catches.
    const frameBox = await this.widget.frameOrigin();
    const dx = Math.abs(canvas.x - (frameBox.x + this.region.x));
    const dy = Math.abs(canvas.y - (frameBox.y + this.region.y));
    assert.ok(
      dx < 40 && dy < 40,
      `canvas is ${Math.round(dx)}px/${Math.round(dy)}px away from the selected region`,
    );
  },
);

Then(
  "a drawing toolbar is visible adjacent to the canvas",
  async function (this: DrawCommentsWorld) {
    assert.ok(await this.widget.drawPanel.isVisible(), "drawing panel not visible");
    assert.ok(
      await this.widget.artifactFrame.getByRole("button", { name: "Rectangle" }).isVisible(),
      "rectangle tool not visible",
    );
    assert.ok(
      await this.widget.artifactFrame.getByRole("button", { name: "Line" }).isVisible(),
      "line tool not visible",
    );
  },
);

Given(
  "the canvas is active with the rectangle tool selected",
  async function (this: DrawCommentsWorld) {
    await this.widget.startAnnotation();
    await this.widget.dragRegion(this.region);
    await this.widget.waitForCanvas();
    await this.widget.selectTool("Rectangle");
  },
);

When(
  "the user click-drags on the canvas to draw a rectangle",
  async function (this: DrawCommentsWorld) {
    await this.widget.drawShape(this.shape);
  },
);

Then("the annotation becomes ready to send", async function (this: DrawCommentsWorld) {
  // The widget's own proof that a shape landed: Send is enabled only when at
  // least one shape exists or a comment has been typed, and no comment was.
  await this.widget.sendButton.waitFor({ state: "visible" });
  assert.ok(
    await this.widget.sendButton.isEnabled(),
    "Send must be enabled once a shape has been drawn",
  );
});

Then(
  "the host artifact content remains visible behind the canvas",
  async function (this: DrawCommentsWorld) {
    assert.ok(
      await this.widget.hostSurface.isVisible(),
      "the host content must stay visible through the transparent canvas",
    );
  },
);

Given(
  "the user has drawn at least one shape on the canvas",
  async function (this: DrawCommentsWorld) {
    await this.drawOneShape();
  },
);

Given(
  "the user has typed the comment {string}",
  async function (this: DrawCommentsWorld, comment: string) {
    this.comment = comment;
    await this.widget.typeComment(comment);
  },
);

When('the user clicks the "Send" button', async function (this: DrawCommentsWorld) {
  await this.widget.send();
});

Then("the annotated image appears in the conversation", async function (this: DrawCommentsWorld) {
  this.annotationImageSrc = await this.widget.waitForAnnotationImage();
  assert.ok(
    this.annotationImageSrc.startsWith("data:image/png;base64,"),
    `annotation image src should be an inline PNG, got "${this.annotationImageSrc.slice(0, 40)}"`,
  );
  assert.ok(
    this.annotationImageSrc.length > 200,
    `annotation PNG looks empty (${this.annotationImageSrc.length} chars)`,
  );
});

Then("Claude receives the annotation and answers", async function (this: DrawCommentsWorld) {
  this.claudeResponse = await this.widget.waitForResponse();
  // Deliberately not asserting the simulator's canned text: it is configurable
  // in the playground, and the behaviour under test is that an answer arrives.
  assert.ok(this.claudeResponse.length > 0, "Claude's response never rendered");
});

When('the user clicks the "Cancel selection" button', async function (this: DrawCommentsWorld) {
  await this.widget.cancelFromSelection();
});

Then("the selection overlay is dismissed", async function (this: DrawCommentsWorld) {
  await this.widget.selectionOverlay.waitFor({ state: "detached" });
});

Then('the "Draw Comment" button is re-enabled', async function (this: DrawCommentsWorld) {
  await this.widget.drawCommentButton.waitFor({ state: "visible" });
  assert.ok(
    await this.widget.drawCommentButton.isEnabled(),
    "Draw Comment must be enabled again after cancelling",
  );
});

Given(
  "the drawing phase is active with the canvas visible",
  async function (this: DrawCommentsWorld) {
    await this.widget.startAnnotation();
    await this.widget.dragRegion(this.region);
    await this.widget.waitForCanvas();
  },
);

When(
  'the user clicks the "Cancel annotation" button in the drawing panel',
  async function (this: DrawCommentsWorld) {
    await this.widget.cancelFromDrawing();
  },
);

Then("the drawing canvas and toolbar are dismissed", async function (this: DrawCommentsWorld) {
  await this.widget.canvas.waitFor({ state: "detached" });
  await this.widget.drawPanel.waitFor({ state: "detached" });
});

When("the user reloads the artifact", async function (this: DrawCommentsWorld) {
  // Goes through the harness, which re-selects the artifact after the reload.
  // Without that, the playground comes back on its default artifact and the
  // assertions below would be looking at the wrong one.
  await this.reloadArtifact();
});
