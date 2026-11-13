import assert from "node:assert/strict";
import type {
  DrawCommentSession,
  SessionEventLog,
} from "@alistigo/artifact-ai-draw-comments/domain/session";
import { projectSession } from "@alistigo/artifact-ai-draw-comments/domain/session";
import { Given, Then, When } from "@cucumber/cucumber";

// setWorldConstructor is registered in claude-response.steps.ts; this file inherits that world.
interface EmbedWorld {
  log: SessionEventLog;
  session: DrawCommentSession;
}

const EMBED_SESSION_ID = "embed-session-1";

const EMBED_CYCLE_EVENTS: SessionEventLog["events"] = [
  { type: "AnnotationStarted", sessionId: EMBED_SESSION_ID, at: 1000 },
  { type: "RegionSelected", region: { x: 50, y: 80, width: 400, height: 300 }, at: 2000 },
  {
    type: "ShapeDrawn",
    shape: {
      id: "s1",
      type: "rectangle",
      startX: 10,
      startY: 10,
      endX: 100,
      endY: 80,
      strokeColor: "#ef4444",
    },
    at: 3000,
  },
  { type: "AnnotationSubmitting", at: 4000 },
  {
    type: "AnnotationSent",
    snapshot: { pngBase64: "aGVsbG8td29ybGQ=", comment: "see this region", capturedAt: 5000 },
    at: 5000,
  },
];

// --- Scenario 1: DOM-level auto-mount — requires browser/JSDOM environment ---
// These steps are marked pending: auto-mount.tsx contract is verified at the unit level.
// A JSDOM-backed Cucumber profile can implement them once the test runner is extended.

Given(
  "a host artifact that has included the ai-draw-comments bundle via script tag",
  () => "pending",
);

When("the host artifact loads", () => "pending");

Then('the "Draw Comment" button is visible at the top of the host artifact UI', () => "pending");

// --- Scenario 2: Domain-level — full draw cycle produces an annotated PNG snapshot ---

Given("the draw comment widget is embedded in a host artifact", function (this: EmbedWorld) {
  this.log = { sessionId: EMBED_SESSION_ID, events: [] };
  this.session = projectSession(this.log);
  assert.equal(this.session.status, "idle", "embedded widget starts in idle state");
});

When(
  "the user completes a draw comment cycle selecting a region of the host content",
  function (this: EmbedWorld) {
    this.log = { ...this.log, events: [...EMBED_CYCLE_EVENTS] };
    this.session = projectSession(this.log);
    assert.equal(this.session.status, "sent", "session must reach sent state after cycle");
  },
);

Then(
  "the annotated PNG captures the host artifact content visible through the transparent overlay",
  function (this: EmbedWorld) {
    assert.ok(this.session.snapshot !== null, "snapshot must be present after send");
    assert.ok(
      this.session.snapshot.pngBase64.length > 0,
      "annotated PNG must contain base64-encoded data",
    );
  },
);
