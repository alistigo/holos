import { ListError } from "../errors/list-error.js";

/** ISO 8601 UTC timestamp string. Example: "2026-05-14T10:00:00Z" */
export type Timestamp = string & { readonly __brand: "Timestamp" };

/**
 * Creates a Timestamp from an ISO 8601 UTC string, validating it parses as a valid date.
 */
export function createTimestamp(iso: string): Timestamp {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new ListError(`Invalid Timestamp: "${iso}" does not parse as a valid date`);
  }
  return iso as Timestamp;
}

/** Returns the current UTC time as a Timestamp. */
export function nowTimestamp(): Timestamp {
  return new Date().toISOString() as Timestamp;
}
