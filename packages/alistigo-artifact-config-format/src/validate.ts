import { validateListConfig } from "@alistigo/artifact-config-list-format";
import { KNOWN_ARTIFACTS } from "./artifacts.js";
import { UnknownArtifactTypeError } from "./errors/artifact-config-error.js";
import type { ArtifactConfig } from "./types.js";

function typeLabel(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function assertIsObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Artifact config must be a non-null object, got ${typeLabel(value)}`);
  }
  return value as Record<string, unknown>;
}

// fallow-ignore-next-line complexity
function assertAppField(raw: Record<string, unknown>): string {
  if (!("app" in raw) || raw.app === undefined) {
    throw new TypeError('Artifact config is missing required field "app"');
  }
  if (typeof raw.app !== "string" || raw.app.trim() === "") {
    throw new TypeError(`Artifact config: "app" must be a non-empty string, got ${typeof raw.app}`);
  }
  return raw.app;
}

function assertLangField(raw: Record<string, unknown>): void {
  if ("lang" in raw && raw.lang !== undefined && typeof raw.lang !== "string") {
    throw new TypeError(`Artifact config: "lang" must be a string, got ${typeof raw.lang}`);
  }
}

function dispatchArtifactValidator(raw: Record<string, unknown>, app: string): ArtifactConfig {
  if (app === "@alistigo/artifact-list") {
    const listConfig = validateListConfig(raw);
    return { ...raw, ...listConfig, app } as ArtifactConfig;
  }
  throw new UnknownArtifactTypeError(app, KNOWN_ARTIFACTS);
}

/**
 * Validate a full artifact config object.
 *
 * @throws {TypeError} if the input shape is invalid.
 * @throws {Error} if the `app` value is an unknown artifact type.
 */
export function validateArtifactConfig(value: unknown): ArtifactConfig {
  const raw = assertIsObject(value);
  const app = assertAppField(raw);
  assertLangField(raw);
  return dispatchArtifactValidator(raw, app);
}
