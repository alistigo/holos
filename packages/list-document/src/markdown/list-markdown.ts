import {
  type ActorId,
  createListElementContent,
  generateListId,
  List,
  type ListId,
} from "@alistigo/list-domain";
import { ListDocumentSerializer } from "../serializer/list-document-serializer.js";
import type { AlistigoDocument } from "../types.js";

export interface MarkdownParseResult {
  title: string | undefined;
  items: string[];
}

// fallow-ignore-next-line complexity
function parseLines(lines: string[]): MarkdownParseResult {
  let title: string | undefined;
  const items: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (i === 0 && trimmed.endsWith(":")) {
      title = trimmed.slice(0, -1).trim();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)/);
    if (unordered !== null) {
      items.push(unordered[1]?.trim() ?? "");
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)/);
    if (ordered !== null) {
      items.push(ordered[1]?.trim() ?? "");
    }
  }

  return { title, items };
}

/** Parses markdown into a title and ordered list of item strings. */
export function parseListMarkdown(markdown: string): MarkdownParseResult {
  return parseLines(markdown.split("\n"));
}

/** Returns true if the markdown contains a recognisable title or at least one item. */
export function isValidListMarkdown(markdown: string): boolean {
  const { title, items } = parseListMarkdown(markdown.trim());
  return title !== undefined || items.length > 0;
}

/** Converts markdown to an AlistigoDocument. Caller supplies actorId; listId is generated when omitted. */
export function buildListDocumentFromMarkdown(
  markdown: string,
  actorId: ActorId,
  listId?: ListId,
): AlistigoDocument {
  const { title, items } = parseListMarkdown(markdown);
  const resolvedListId = listId ?? generateListId();

  const { list } = List.create({
    actorId,
    listId: resolvedListId,
    ...(title !== undefined ? { title } : {}),
  });

  for (const item of items) {
    const content = createListElementContent(item);
    list.addListElement({ actorId, listId: resolvedListId, content });
  }

  return ListDocumentSerializer.serialize(list, undefined);
}
