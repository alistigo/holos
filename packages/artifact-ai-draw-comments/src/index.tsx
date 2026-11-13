export { ClaudeUnavailableError, sendAnnotation } from "./application/claude-bridge.js";
export { sendAnnotationUseCase } from "./application/send-annotation.js";
export type {
  AnnotatedSnapshot,
  DrawCommentSession,
  SelectionRegion,
  SessionEvent,
  SessionEventLog,
  SessionStatus,
} from "./domain/session.js";
export { canSend, projectSession } from "./domain/session.js";
export type { DrawShape } from "./domain/shapes.js";
export { DEFAULT_STROKE_COLOR } from "./domain/shapes.js";
export { buildAnnotatedSnapshot } from "./domain/snapshot.js";
