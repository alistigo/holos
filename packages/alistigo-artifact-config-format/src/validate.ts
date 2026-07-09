import { validateListConfig } from "@alistigo/artifact-config-list-format";
import { KNOWN_ARTIFACTS } from "./artifacts.js";
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

/**
 * Validates only the shape of `plugins` — an object whose values are themselves
 * objects. Deliberately does NOT validate any individual plugin's own config shape,
 * so this package never needs to import a plugin package.
 */
function assertPluginsField(raw: Record<string, unknown>): void {
  if (!("plugins" in raw) || raw.plugins === undefined) return;

  if (typeof raw.plugins !== "object" || raw.plugins === null || Array.isArray(raw.plugins)) {
    throw new TypeError(
      `Artifact config: "plugins" must be an object, got ${typeLabel(raw.plugins)}`,
    );
  }

  for (const [pluginName, pluginConfig] of Object.entries(raw.plugins as Record<string, unknown>)) {
    if (typeof pluginConfig !== "object" || pluginConfig === null || Array.isArray(pluginConfig)) {
      throw new TypeError(
        `Artifact config: plugins["${pluginName}"] must be an object, got ${typeLabel(pluginConfig)}`,
      );
    }
  }
}

function dispatchArtifactValidator(raw: Record<string, unknown>, app: string): ArtifactConfig {
  if (app === "@alistigo/artifact-list") {
    const listConfig = validateListConfig(raw);
    return { ...raw, ...listConfig, app } as ArtifactConfig;
  }
  throw new Error(`Unknown artifact type: "${app}". Known types: ${KNOWN_ARTIFACTS.join(", ")}`);
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
  assertPluginsField(raw);
  return dispatchArtifactValidator(raw, app);
}
