import type { Stage } from "konva/lib/Stage";
import type { DrawCommentSession } from "../domain/session.js";
import { canSend } from "../domain/session.js";
import { buildAnnotatedSnapshot } from "../domain/snapshot.js";
import { sendAnnotation } from "./claude-bridge.js";

export async function sendAnnotationUseCase(
  session: DrawCommentSession,
  regionEl: HTMLElement,
  konvaStage: Stage,
): Promise<string> {
  if (!canSend(session)) {
    throw new Error("Cannot send: no shapes drawn and no comment provided");
  }

  const snapshot = await buildAnnotatedSnapshot(regionEl, konvaStage, session.comment);
  return sendAnnotation(snapshot);
}
