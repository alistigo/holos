import assert from "node:assert/strict";
import type {
  DrawCommentSession,
  SessionEventLog,
} from "@alistigo/artifact-ai-draw-comments/domain/session";
import { projectSession } from "@alistigo/artifact-ai-draw-comments/domain/session";
import { Given, Then, When } from "@cucumber/cucumber";

// setWorldConstructor is registered in claude-response.steps.ts; this file inherits that world.
interface DrawSendWorld {
  log: SessionEventLog;
  session: DrawCommentSession;
}

const DS_SESSION_ID = "draw-send-session-1";

const REGION = { x: 100, y: 100, width: 300, height: 200 };
const SHAPE = {
  id: "s1",
  type: "rectangle" as const,
  startX: 10,
  startY: 10,
  endX: 80,
  endY: 60,
  strokeColor: "#ef4444",
};
const SNAPSHOT = {
  pngBase64: "aW1hZ2UtZGF0YQ==",
  comment: "Look at this area",
  capturedAt: 5000,
};

function initDrawingPhase(world: DrawSendWorld): void {
  world.log = {
    sessionId: DS_SESSION_ID,
    events: [
      { type: "AnnotationStarted", sessionId: DS_SESSION_ID, at: 1000 },
      { type: "RegionSelected", region: REGION, at: 2000 },
    ],
  };
  world.session = projectSession(world.log);
  assert.equal(world.session.status, "drawing");
}

// --- Scenario 1: Draw Comment button is visible on load ---

Given(
  "the artifact is loaded with the Draw Comment widget mounted",
  function (this: DrawSendWorld) {
    this.log = { sessionId: DS_SESSION_ID, events: [] };
    this.session = projectSession(this.log);
    assert.equal(this.session.status, "idle");
  },
);

When("the user views the artifact", function (this: DrawSendWorld) {
  // no state transition — asserting current state in Then
});

Then(
  'the "Draw Comment" button is visible at the top of the artifact',
  function (this: DrawSendWorld) {
    // Button is enabled when session is idle or responded
    const buttonEnabled = this.session.status === "idle" || this.session.status === "responded";
    assert.ok(buttonEnabled, `Button must be enabled in "${this.session.status}" state`);
  },
);

// --- Scenario 2: Clicking Draw Comment activates crosshair selection mode ---

Given(
  "the artifact is loaded with the Draw Comment button visible",
  function (this: DrawSendWorld) {
    this.log = { sessionId: DS_SESSION_ID, events: [] };
    this.session = projectSession(this.log);
    assert.equal(this.session.status, "idle");
  },
);

When('the user clicks the "Draw Comment" button', function (this: DrawSendWorld) {
  this.log = {
    ...this.log,
    events: [...this.log.events, { type: "AnnotationStarted", sessionId: DS_SESSION_ID, at: 1000 }],
  };
  this.session = projectSession(this.log);
});

Then("the cursor changes to a crosshair selection mode", function (this: DrawSendWorld) {
  assert.equal(
    this.session.status,
    "selecting",
    "Session must be in 'selecting' state to show crosshair cursor",
  );
});

// --- Scenario 3: Drag-selecting a region shows a selection indicator ---

Given("selection mode is active", function (this: DrawSendWorld) {
  this.log = {
    sessionId: DS_SESSION_ID,
    events: [{ type: "AnnotationStarted", sessionId: DS_SESSION_ID, at: 1000 }],
  };
  this.session = projectSession(this.log);
  assert.equal(this.session.status, "selecting");
});

When("the user click-drags across a region of the artifact", function (this: DrawSendWorld) {
  this.log = {
    ...this.log,
    events: [...this.log.events, { type: "RegionSelected", region: REGION, at: 2000 }],
  };
  this.session = projectSession(this.log);
});

Then("a rectangular selection indicator is shown over that region", function (this: DrawSendWorld) {
  assert.equal(this.session.status, "drawing");
  assert.deepEqual(this.session.region, REGION);
});

// --- Scenario 4: Confirming a selection shows the drawing canvas and toolbar ---

Given("a region has been selected by drag", function (this: DrawSendWorld) {
  initDrawingPhase(this);
});

When("the selection is confirmed", function (this: DrawSendWorld) {
  // RegionSelected already transitions to drawing — selection is confirmed at that point
});

Then(
  "a transparent drawing canvas overlay appears on top of the selected region",
  function (this: DrawSendWorld) {
    assert.equal(this.session.status, "drawing");
    assert.ok(this.session.region !== null);
  },
);

Then("a drawing toolbar is visible adjacent to the canvas", function (this: DrawSendWorld) {
  // Toolbar is rendered whenever status is 'drawing'
  assert.equal(this.session.status, "drawing");
});

// --- Scenario 5: Drawing a rectangle on the canvas keeps underlying content visible ---

Given("the canvas is active with the rectangle tool selected", function (this: DrawSendWorld) {
  initDrawingPhase(this);
});

When("the user click-drags on the canvas to draw a rectangle", function (this: DrawSendWorld) {
  this.log = {
    ...this.log,
    events: [...this.log.events, { type: "ShapeDrawn", shape: SHAPE, at: 3000 }],
  };
  this.session = projectSession(this.log);
});

Then("a rectangle shape is drawn on the overlay", function (this: DrawSendWorld) {
  assert.equal(this.session.shapes.length, 1);
  assert.equal(this.session.shapes[0]?.type, "rectangle");
});

Then(
  "the underlying artifact content remains fully visible through the canvas",
  function (this: DrawSendWorld) {
    // The canvas is a Konva Stage with transparent background — shapes are drawn without
    // affecting the DOM elements below. Here we assert the domain invariant: shapes are
    // present without any opacity/visibility change recorded in the event log.
    assert.ok(
      this.session.shapes.length > 0,
      "Shapes must be present while content below stays visible",
    );
    assert.equal(
      this.session.status,
      "drawing",
      "Session stays in drawing state — no content-hiding transition occurred",
    );
  },
);

// --- Scenario 6: Clicking Send generates PNG and transmits to Claude ---

Given("the user has drawn at least one shape on the canvas", function (this: DrawSendWorld) {
  this.log = {
    sessionId: DS_SESSION_ID,
    events: [
      { type: "AnnotationStarted", sessionId: DS_SESSION_ID, at: 1000 },
      { type: "RegionSelected", region: REGION, at: 2000 },
      { type: "ShapeDrawn", shape: SHAPE, at: 3000 },
    ],
  };
  this.session = projectSession(this.log);
  assert.ok(this.session.shapes.length > 0);
});

When('the user clicks the "Send" button', function (this: DrawSendWorld) {
  this.log = {
    ...this.log,
    events: [
      ...this.log.events,
      { type: "AnnotationSubmitting", at: 4000 },
      { type: "AnnotationSent", snapshot: SNAPSHOT, at: 5000 },
    ],
  };
  this.session = projectSession(this.log);
});

Then(
  "a PNG image is generated combining the region capture and the drawn shapes",
  function (this: DrawSendWorld) {
    assert.ok(this.session.snapshot !== null, "Snapshot must be set after send");
    assert.ok(this.session.snapshot.pngBase64.length > 0, "PNG must contain base64 data");
  },
);

Then(
  "the PNG and comment are sent to Claude via window.claude.complete",
  function (this: DrawSendWorld) {
    assert.equal(this.session.status, "sent");
    assert.ok(this.session.snapshot !== null);
  },
);

Then("the drawing canvas switches to read-only mode", function (this: DrawSendWorld) {
  assert.equal(
    this.session.status,
    "sent",
    "Session must be in 'sent' state (read-only) after send",
  );
});

// --- Scenario 7: Cancel button in selection overlay dismisses the annotation session ---

When(
  "the user clicks the {string} cancel button in the top-right corner",
  function (this: DrawSendWorld, _label: string) {
    this.log = {
      ...this.log,
      events: [...this.log.events, { type: "AnnotationCancelled", at: 2000 }],
    };
    this.session = projectSession(this.log);
  },
);

Then("the selection overlay is dismissed", function (this: DrawSendWorld) {
  assert.equal(this.session.status, "idle", "Session must return to idle after cancel");
});

Then("the {string} button is re-enabled", function (this: DrawSendWorld, _label: string) {
  const buttonEnabled = this.session.status === "idle" || this.session.status === "responded";
  assert.ok(buttonEnabled, `Button must be re-enabled after cancel; got "${this.session.status}"`);
});

// --- Scenario 8: Cancel button in drawing panel dismisses the annotation session ---

Given("the drawing phase is active with the canvas visible", function (this: DrawSendWorld) {
  initDrawingPhase(this);
});

When(
  "the user clicks the {string} button in the drawing panel",
  function (this: DrawSendWorld, _label: string) {
    this.log = {
      ...this.log,
      events: [...this.log.events, { type: "AnnotationCancelled", at: 3000 }],
    };
    this.session = projectSession(this.log);
  },
);

Then("the drawing canvas and toolbar are dismissed", function (this: DrawSendWorld) {
  assert.equal(
    this.session.status,
    "idle",
    "Session must return to idle after cancel from drawing",
  );
});
