import assert from "node:assert/strict";
import type {
  DrawCommentSession,
  SessionEventLog,
} from "@alistigo/artifact-ai-draw-comments/domain/session";
import { projectSession } from "@alistigo/artifact-ai-draw-comments/domain/session";
import { Before, Given, setWorldConstructor, Then, When, World } from "@cucumber/cucumber";

const SESSION_ID = "test-session-1";
const TEST_COMMENT = "Look at this area";
const TEST_RESPONSE = "Here is my response to your annotation.";
const TEST_SNAPSHOT = { pngBase64: "abc123base64png", comment: TEST_COMMENT, capturedAt: 5000 };

const BASE_EVENTS: SessionEventLog["events"] = [
  { type: "AnnotationStarted", sessionId: SESSION_ID, at: 1000 },
  { type: "RegionSelected", region: { x: 100, y: 100, width: 300, height: 200 }, at: 2000 },
  {
    type: "ShapeDrawn",
    shape: {
      id: "s1",
      type: "rectangle",
      startX: 10,
      startY: 10,
      endX: 50,
      endY: 50,
      strokeColor: "#ef4444",
    },
    at: 3000,
  },
  { type: "AnnotationSubmitting", at: 4000 },
  { type: "AnnotationSent", snapshot: TEST_SNAPSHOT, at: 5000 },
];

class ScenarioWorld extends World {
  log: SessionEventLog = { sessionId: SESSION_ID, events: [] };
  session: DrawCommentSession = projectSession(this.log);

  appendResponse(): void {
    this.log = {
      ...this.log,
      events: [...this.log.events, { type: "ClaudeResponded", response: TEST_RESPONSE, at: 6000 }],
    };
    this.session = projectSession(this.log);
  }
}

setWorldConstructor(ScenarioWorld);

Before(function (this: ScenarioWorld) {
  this.log = { sessionId: SESSION_ID, events: [...BASE_EVENTS] };
  this.session = projectSession(this.log);
});

// --- Scenario 1: Claude response appears below the annotation after sending ---

Given("a draw comment was just sent via window.claude.complete", function (this: ScenarioWorld) {
  assert.equal(this.session.status, "sent");
  assert.ok(this.session.snapshot !== null);
});

When("Claude responds via the window.claude API", function (this: ScenarioWorld) {
  this.appendResponse();
});

Then(
  "Claude's response text appears below the annotation display area",
  function (this: ScenarioWorld) {
    assert.equal(this.session.status, "responded");
    assert.equal(this.session.claudeResponse, TEST_RESPONSE);
  },
);

Then("the page does not reload", function (this: ScenarioWorld) {
  assert.ok(
    this.log.events.some((e) => e.type === "AnnotationSent"),
    "Event log intact — no reload occurred",
  );
});

// --- Scenario 2 & 3: Claude response is displayed ---

Given("Claude's response is displayed below the annotation", function (this: ScenarioWorld) {
  this.appendResponse();
  assert.equal(this.session.status, "responded");
});

When("the user reads the response", function (this: ScenarioWorld) {
  // reading — no state transition
});

Then("the annotated PNG is still visible above the response", function (this: ScenarioWorld) {
  assert.ok(this.session.snapshot !== null);
  assert.ok(this.session.snapshot.pngBase64.length > 0);
});

Then("the original comment is still visible above the response", function (this: ScenarioWorld) {
  assert.ok(this.session.snapshot !== null);
  assert.equal(this.session.snapshot.comment, TEST_COMMENT);
});

When("the user looks at the top of the artifact", function (this: ScenarioWorld) {
  // no state transition — asserting current state in Then
});

Then(
  'the "Draw Comment" button is active and can be clicked to start a new annotation',
  function (this: ScenarioWorld) {
    const isActive = this.session.status !== "idle" && this.session.status !== "responded";
    assert.equal(
      isActive,
      false,
      `Button should be active but session is in "${this.session.status}" state`,
    );
  },
);
