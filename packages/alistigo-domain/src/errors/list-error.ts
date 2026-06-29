import { AbstractAlistigoError } from "./abstract-alistigo-error.js";

export abstract class AbstractListError extends AbstractAlistigoError {}

export class ListElementNotFoundError extends AbstractListError {
  constructor(listElementId: string) {
    super("ListElement not found", { listElementId });
  }
}

export class InvalidListIdError extends AbstractListError {
  constructor(raw: string) {
    super("Invalid ListId format", { raw });
  }
}

export class InvalidListElementContentError extends AbstractListError {
  constructor(reason: "empty" | "too_long", valueLength?: number) {
    super(
      "Invalid ListElementContent",
      valueLength !== undefined ? { reason, valueLength } : { reason },
    );
  }
}

export class InvalidSchemaVersionError extends AbstractListError {
  constructor(raw: string) {
    super("Invalid SchemaVersion — must match MAJOR.MINOR.PATCH", { raw });
  }
}

export class InvalidTimestampError extends AbstractListError {
  constructor(raw: string) {
    super("Invalid Timestamp — does not parse as a valid date", { raw });
  }
}
