import type { AlistigoDocument } from "@alistigo/list";
import { buildListDocumentFromMarkdown } from "@alistigo/list";
import { generateActorId } from "@alistigo/list-domain";

const AI_ACTOR_ID = generateActorId();

const AI_INITIAL_INPUT_ELEMENT_ID = "ai-input-action";
const SUPPORTED_TYPE = "text/markdown";

/** Reads #ai-input-action from the DOM, parses it as AiInitialInput, removes the tag, returns the document. */
// fallow-ignore-next-line complexity
export function readAiInitialInput(): AlistigoDocument | undefined {
  const el = document.getElementById(AI_INITIAL_INPUT_ELEMENT_ID);
  if (el === null) return undefined;

  const type = el.getAttribute("type") ?? "";
  if (type !== SUPPORTED_TYPE) {
    console.error(
      `[Alistigo] #${AI_INITIAL_INPUT_ELEMENT_ID} has unsupported type "${type}". Only "text/markdown" is supported.`,
    );
    el.remove();
    return undefined;
  }

  const markdown = el.textContent?.trim() ?? "";
  el.remove();

  if (markdown === "") return undefined;

  try {
    return buildListDocumentFromMarkdown(markdown, AI_ACTOR_ID);
  } catch (err) {
    console.error("[Alistigo] Failed to parse #ai-input-action:", err);
    return undefined;
  }
}
