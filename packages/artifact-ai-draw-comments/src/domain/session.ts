import type { DrawShape } from "./shapes.js";

export type SessionStatus = "idle" | "selecting" | "drawing" | "submitting" | "sent" | "responded";

export interface SelectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotatedSnapshot {
  pngBase64: string;
  comment: string;
  capturedAt: number;
}

export interface DrawCommentSession {
  id: string;
  status: SessionStatus;
  region: SelectionRegion | null;
  shapes: DrawShape[];
  comment: string;
  snapshot: AnnotatedSnapshot | null;
  claudeResponse: string | null;
  error: string | null;
}

export type SessionEvent =
  | { type: "AnnotationStarted"; sessionId: string; at: number }
  | { type: "RegionSelected"; region: SelectionRegion; at: number }
  | { type: "ShapeDrawn"; shape: DrawShape; at: number }
  | { type: "CommentUpdated"; comment: string; at: number }
  | { type: "AnnotationSubmitting"; at: number }
  | { type: "AnnotationSent"; snapshot: AnnotatedSnapshot; at: number }
  | { type: "SendFailed"; error: string; at: number }
  | { type: "ClaudeResponded"; response: string; at: number }
  | { type: "AnnotationCancelled"; at: number };

export interface SessionEventLog {
  sessionId: string;
  events: SessionEvent[];
}

function initialSession(sessionId: string): DrawCommentSession {
  return {
    id: sessionId,
    status: "idle",
    region: null,
    shapes: [],
    comment: "",
    snapshot: null,
    claudeResponse: null,
    error: null,
  };
}

type Reducer<E extends SessionEvent> = (s: DrawCommentSession, e: E) => DrawCommentSession;

// biome-ignore lint/suspicious/noExplicitAny: discriminated union dispatch
const reducers: Record<string, Reducer<any>> = {
  AnnotationStarted: (s: DrawCommentSession) => ({ ...s, status: "selecting" }),
  RegionSelected: (
    s: DrawCommentSession,
    e: Extract<SessionEvent, { type: "RegionSelected" }>,
  ) => ({
    ...s,
    status: "drawing",
    region: e.region,
  }),
  ShapeDrawn: (s: DrawCommentSession, e: Extract<SessionEvent, { type: "ShapeDrawn" }>) => ({
    ...s,
    shapes: [...s.shapes, e.shape],
  }),
  CommentUpdated: (
    s: DrawCommentSession,
    e: Extract<SessionEvent, { type: "CommentUpdated" }>,
  ) => ({
    ...s,
    comment: e.comment,
  }),
  AnnotationSubmitting: (s: DrawCommentSession) => ({ ...s, status: "submitting", error: null }),
  AnnotationSent: (
    s: DrawCommentSession,
    e: Extract<SessionEvent, { type: "AnnotationSent" }>,
  ) => ({
    ...s,
    status: "sent",
    snapshot: e.snapshot,
    error: null,
  }),
  SendFailed: (s: DrawCommentSession, e: Extract<SessionEvent, { type: "SendFailed" }>) => ({
    ...s,
    status: "drawing",
    error: e.error,
  }),
  ClaudeResponded: (
    s: DrawCommentSession,
    e: Extract<SessionEvent, { type: "ClaudeResponded" }>,
  ) => ({
    ...s,
    status: "responded",
    claudeResponse: e.response,
  }),
  AnnotationCancelled: (s: DrawCommentSession) => ({ ...s, status: "idle" }),
};

export function projectSession(log: SessionEventLog): DrawCommentSession {
  return log.events.reduce(
    (s, e) => (reducers[e.type] ?? ((x: DrawCommentSession) => x))(s, e),
    initialSession(log.sessionId),
  );
}

export function canSend(session: DrawCommentSession): boolean {
  return session.shapes.length > 0 || session.comment.trim().length > 0;
}
