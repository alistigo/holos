import type { Stage } from "konva/lib/Stage";
import type { AnnotatedSnapshot, DrawCommentSession } from "../domain/session.js";
import { canSend } from "../domain/session.js";
import { sendAnnotation } from "./claude-bridge.js";
import { buildAnnotatedSnapshot } from "./snapshot-builder.js";

export interface SendAnnotationResult {
  snapshot: AnnotatedSnapshot;
  response: string;
}

export async function sendAnnotationUseCase(
  session: DrawCommentSession,
  regionEl: HTMLElement,
  konvaStage: Stage,
): Promise<SendAnnotationResult> {
  if (!canSend(session)) {
    throw new Error("Cannot send: no shapes drawn and no comment provided");
  }
  const snapshot = await buildAnnotatedSnapshot(regionEl, konvaStage, session.comment);
  const response = await sendAnnotation(snapshot);
  return { snapshot, response };
}
