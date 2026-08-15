import type { AlistigoDocument } from "@alistigo/list-document-format";
import { ListDocumentSerializer } from "@alistigo/list-document-format";
import {
  createListElementContent,
  generateActorId,
  generateListId,
  List,
} from "@alistigo/list-domain";

const AI_ACTOR_ID = generateActorId();

const AI_INPUT_ELEMENT_ID = "ai-input-action";
const SUPPORTED_TYPE = "text/markdown";

interface ParsedItem {
  text: string;
}

function parseMarkdownItems(lines: string[]): { title: string | undefined; items: ParsedItem[] } {
  let title: string | undefined;
  const items: ParsedItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (i === 0 && trimmed.endsWith(":")) {
      title = trimmed.slice(0, -1).trim();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    if (unordered !== null) {
      items.push({ text: unordered[1]?.trim() ?? "" });
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)/);
    if (ordered !== null) {
      items.push({ text: ordered[1]?.trim() ?? "" });
    }
  }

  return { title, items };
}

function buildDocumentFromMarkdown(markdown: string): AlistigoDocument {
  const lines = markdown.split("\n");
  const { title, items } = parseMarkdownItems(lines);
  const listId = generateListId();

  const { list } = List.create({
    actorId: AI_ACTOR_ID,
    listId,
    ...(title !== undefined ? { title } : {}),
  });

  for (const item of items) {
    const content = createListElementContent(item.text);
    list.addListElement({ actorId: AI_ACTOR_ID, listId, content });
  }

  return ListDocumentSerializer.serialize(list, undefined);
}

/** Reads #ai-input-action from the DOM, parses it, removes the tag, returns the document. */
export function readAiInputDocument(): AlistigoDocument | undefined {
  const el = document.getElementById(AI_INPUT_ELEMENT_ID);
  if (el === null) return undefined;

  const type = el.getAttribute("type") ?? "";
  if (type !== SUPPORTED_TYPE) {
    console.error(
      `[Alistigo] #${AI_INPUT_ELEMENT_ID} has unsupported type "${type}". Only "text/markdown" is supported.`,
    );
    el.remove();
    return undefined;
  }

  const markdown = el.textContent?.trim() ?? "";
  el.remove();

  if (markdown === "") return undefined;

  try {
    return buildDocumentFromMarkdown(markdown);
  } catch (err) {
    console.error("[Alistigo] Failed to parse #ai-input-action markdown:", err);
    return undefined;
  }
}
