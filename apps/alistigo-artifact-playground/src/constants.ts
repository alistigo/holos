import { ARTIFACT_REGISTRY } from "@alistigo/artifact-manager";
import type { PlaygroundCatalog } from "./playground-config";

export const KNOWN_APPS = Object.keys(ARTIFACT_REGISTRY) as string[];

// Canonical in playground-config.ts, which imports nothing — the pure modules
// validate against it and must not reach the registry. Re-exported here so the
// form keeps importing it from its usual place.
export { AI_CONTEXTS } from "./playground-config";

/** Plugin package names available for the given artifact type, per the manager's registry. */
export function getAvailablePlugins(app: string): readonly string[] {
  return ARTIFACT_REGISTRY[app]?.availablePlugins ?? [];
}

/**
 * Builds the catalogue the pure modules validate restored and URL-supplied
 * values against.
 *
 * This is the only place that reads the registry on their behalf, so
 * `playground-state.ts` and `playground-url.ts` stay importable from `bun test`
 * without the registry, and a test can pass a stub instead.
 *
 * @param documentNames Fixture names from `useDocumentFixtures()` — Vite's
 *   `import.meta.glob` resolves those, so the caller supplies them.
 * @param modeSelectable Whether the Source field is offered, i.e. `import.meta.env.DEV`.
 *   Read by the caller, so nothing here depends on the build mode.
 */
export function buildPlaygroundCatalog(
  documentNames: readonly string[],
  modeSelectable: boolean,
): PlaygroundCatalog {
  return {
    knownApps: KNOWN_APPS,
    pluginsFor: getAvailablePlugins,
    documentNames,
    modeSelectable,
  };
}
