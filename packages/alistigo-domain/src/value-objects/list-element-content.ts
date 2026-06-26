import { ListError } from "../errors/list-error.js";

const MAX_CONTENT_LENGTH = 2000;

/** Branded type for validated, trimmed list element content. */
export type ListElementContent = string & { readonly __brand: "ListElementContent" };

/**
 * Creates a validated ListElementContent value object.
 * Trims whitespace, enforces non-empty and max 2000 characters.
 */
export function createListElementContent(raw: string): ListElementContent {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new ListError("ListElementContent cannot be empty");
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    throw new ListError(
      `ListElementContent exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
    );
  }
  return trimmed as ListElementContent;
}
