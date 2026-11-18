import { describe, expect, test } from "bun:test";
import { canSend, projectSession, type SessionEvent, type SessionEventLog } from "./session.js";

/**
 * Domain-level coverage of the session projection.
 *
 * These assertions were previously carried by the Gherkin step definitions in
 * `@alistigo/artifact-ai-draw-comments-features`, which asserted against
 * `projectSession` in process rather than driving the widget. Those scenarios
 * now run in a browser against the real UI, so the domain-level checks live
 * here instead — keeping the fast, deterministic feedback on the projection
 * that the in-process suite used to provide.
 */

const SESSION_ID = "dcs_00000000000000000000000001";
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
const SNAPSHOT = { pngBase64: "aW1hZ2UtZGF0YQ==", comment: "Look at this area", capturedAt: 5000 };
const RESPONSE = "Here is my response to your annotation.";

function log(...events: SessionEvent[]): SessionEventLog {
  return { sessionId: SESSION_ID, events };
}

const started: SessionEvent = { type: "AnnotationStarted", sessionId: SESSION_ID, at: 1000 };
const regionSelected: SessionEvent = { type: "RegionSelected", region: REGION, at: 2000 };
const shapeDrawn: SessionEvent = { type: "ShapeDrawn", shape: SHAPE, at: 3000 };
const submitting: SessionEvent = { type: "AnnotationSubmitting", at: 4000 };
const sent: SessionEvent = { type: "AnnotationSent", snapshot: SNAPSHOT, at: 5000 };
const responded: SessionEvent = { type: "ClaudeResponded", response: RESPONSE, at: 6000 };
const cancelled: SessionEvent = { type: "AnnotationCancelled", at: 7000 };

describe("projectSession — status transitions", () => {
  test("an empty log projects an idle session", () => {
    const session = projectSession(log());
    expect(session.status).toBe("idle");
    expect(session.region).toBeNull();
    expect(session.shapes).toEqual([]);
    expect(session.snapshot).toBeNull();
    expect(session.claudeResponse).toBeNull();
  });

  test("AnnotationStarted moves to selecting", () => {
    expect(projectSession(log(started)).status).toBe("selecting");
  });

  test("RegionSelected moves to drawing and records the region", () => {
    const session = projectSession(log(started, regionSelected));
    expect(session.status).toBe("drawing");
    expect(session.region).toEqual(REGION);
  });

  test("AnnotationSubmitting moves to submitting", () => {
    expect(projectSession(log(started, regionSelected, shapeDrawn, submitting)).status).toBe(
      "submitting",
    );
  });

  test("AnnotationSent moves to sent and records the snapshot", () => {
    const session = projectSession(log(started, regionSelected, shapeDrawn, submitting, sent));
    expect(session.status).toBe("sent");
    expect(session.snapshot).toEqual(SNAPSHOT);
    expect(session.claudeResponse).toBeNull();
  });

  test("ClaudeResponded moves to responded and records the answer", () => {
    const session = projectSession(
      log(started, regionSelected, shapeDrawn, submitting, sent, responded),
    );
    expect(session.status).toBe("responded");
    expect(session.claudeResponse).toBe(RESPONSE);
    // The annotation stays available alongside the response.
    expect(session.snapshot).toEqual(SNAPSHOT);
    expect(session.snapshot?.comment).toBe("Look at this area");
  });

  test("SendFailed returns to drawing and records the error", () => {
    const session = projectSession(
      log(started, regionSelected, shapeDrawn, submitting, {
        type: "SendFailed",
        error: "boom",
        at: 5000,
      }),
    );
    expect(session.status).toBe("drawing");
    expect(session.error).toBe("boom");
  });
});

describe("projectSession — cancellation", () => {
  test("cancelling from selecting returns to idle", () => {
    expect(projectSession(log(started, cancelled)).status).toBe("idle");
  });

  test("cancelling from drawing returns to idle", () => {
    expect(projectSession(log(started, regionSelected, cancelled)).status).toBe("idle");
  });

  test("cancelling after a shape was drawn returns to idle", () => {
    expect(projectSession(log(started, regionSelected, shapeDrawn, cancelled)).status).toBe("idle");
  });
});

describe("projectSession — shapes and comment", () => {
  test("each ShapeDrawn appends a shape", () => {
    const second = { ...SHAPE, id: "s2" };
    const session = projectSession(
      log(started, regionSelected, shapeDrawn, { type: "ShapeDrawn", shape: second, at: 3500 }),
    );
    expect(session.shapes).toHaveLength(2);
    expect(session.shapes[0]?.type).toBe("rectangle");
    expect(session.shapes[1]?.id).toBe("s2");
  });

  test("CommentUpdated records the latest comment", () => {
    const session = projectSession(
      log(started, regionSelected, { type: "CommentUpdated", comment: "first", at: 3000 }),
    );
    expect(session.comment).toBe("first");
  });
});

describe("canSend", () => {
  test("a drawing session with a shape can send", () => {
    expect(canSend(projectSession(log(started, regionSelected, shapeDrawn)))).toBe(true);
  });

  test("a drawing session with only a comment can send", () => {
    const session = projectSession(
      log(started, regionSelected, { type: "CommentUpdated", comment: "just words", at: 3000 }),
    );
    expect(canSend(session)).toBe(true);
  });

  test("a drawing session with neither shape nor comment cannot send", () => {
    expect(canSend(projectSession(log(started, regionSelected)))).toBe(false);
  });

  test("an idle session cannot send", () => {
    expect(canSend(projectSession(log()))).toBe(false);
  });
});
