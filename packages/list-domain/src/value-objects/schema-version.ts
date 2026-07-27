import { ListError } from "../errors/list-error.js";

/** Semver string in MAJOR.MINOR.PATCH format. */
export type SchemaVersion = `${number}.${number}.${number}`;

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

export function createSchemaVersion(raw: string): SchemaVersion {
  if (!SEMVER_RE.test(raw)) {
    throw new ListError(`Invalid SchemaVersion: "${raw}" must match MAJOR.MINOR.PATCH`);
  }
  return raw as SchemaVersion;
}

/** The current M1 schema version. */
export const CURRENT_SCHEMA_VERSION: SchemaVersion = "1.0.0";
