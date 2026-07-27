/**
 * Base error for the Core List Context.
 * Raised when a List command is rejected or an invariant is violated.
 */
export class ListError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListError";
  }
}

/** Raised when a command references a ListElementId that does not exist. */
export class ListElementNotFoundError extends ListError {
  constructor(listElementId: string) {
    super(`ListElement not found: ${listElementId}`);
    this.name = "ListElementNotFoundError";
  }
}

/** Raised when a provided ListId does not match the expected format. */
export class InvalidListIdError extends ListError {
  constructor(raw: string) {
    super(`Invalid ListId: "${raw}"`);
    this.name = "InvalidListIdError";
  }
}

/** Raised when ListElementContent validation fails (empty or too long). */
export class InvalidListElementContentError extends ListError {
  constructor(reason: string) {
    super(`Invalid ListElementContent: ${reason}`);
    this.name = "InvalidListElementContentError";
  }
}
