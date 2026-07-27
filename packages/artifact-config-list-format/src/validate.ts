import type { ListArtifactConfig } from "./types.js";

/**
 * Validate and extract list-specific config from an unknown value.
 *
 * Rules:
 * - Input must be a non-array object (null is treated as empty config).
 * - If `readonly` is present, it must be a boolean.
 * - Extra fields are ignored — this function extracts only list-relevant fields,
 *   so it composes safely with the aggregate artifact-config validator that may
 *   pass in a config object containing fields like `app` or `lang`.
 * - Returns a `ListArtifactConfig` with defaults applied (`readonly` defaults to false).
 *
 * @throws {TypeError} if the input is not an object, or if `readonly` is not a boolean.
 */
// fallow-ignore-next-line complexity
export function validateListConfig(value: unknown): ListArtifactConfig {
  if (value === null) {
    return { readonly: false };
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(
      `List artifact config must be an object, got ${Array.isArray(value) ? "array" : typeof value}`,
    );
  }

  const raw = value as Record<string, unknown>;

  if ("readonly" in raw && raw.readonly !== undefined) {
    if (typeof raw.readonly !== "boolean") {
      throw new TypeError(
        `List artifact config: "readonly" must be a boolean, got ${typeof raw.readonly}`,
      );
    }
    return { readonly: raw.readonly as boolean };
  }

  return { readonly: false };
}
