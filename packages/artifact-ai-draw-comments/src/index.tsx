export { App } from "./App.js";
export { ClaudeUnavailableError, sendAnnotation } from "./application/claude-bridge.js";
export { sendAnnotationUseCase } from "./application/send-annotation.js";
export { buildAnnotatedSnapshot } from "./application/snapshot-builder.js";
export { mount, unmount } from "./auto-mount.js";
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

export function isReady(): boolean {
  return "claude" in window;
}

declare global {
  interface Window {
    AiDrawComments: {
      mount: (container: HTMLElement) => void;
      unmount: () => void;
      isReady: () => boolean;
    };
  }
}

import { mount as mountFn, unmount as unmountFn } from "./auto-mount.js";

window.AiDrawComments = { mount: mountFn, unmount: unmountFn, isReady };
