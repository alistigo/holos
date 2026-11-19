/**
 * The two values a playground address may carry.
 *
 * Pure: the caller passes `window.location.search` in as a string. Nothing here
 * reads `window`, and nothing here writes to the address — no `pushState`, no
 * `replaceState`, no assignment to `location`. The parameters seed the setup on
 * load and then stop existing as far as the app is concerned, which is what lets
 * a selection the developer makes afterwards be final (FR-011).
 *
 * Types come from `playground-config.ts` only, for the same no-cycle reason as
 * `playground-state.ts`.
 */

import type { Config, PlaygroundCatalog, PlaygroundMode } from "./playground-config";

export const URL_PARAM_ARTIFACT = "artifact";
export const URL_PARAM_SOURCE = "source";

/** What the address is allowed to set. */
export type UrlOverrides = Partial<Pick<Config, "app" | "mode">>;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** `@alistigo/artifact-list` → the forms a developer might reasonably type. */
function aliasesFor(app: string): string[] {
  const unscoped = app.replace(/^@[^/]+\//, "");
  return [normalize(app), normalize(unscoped), normalize(unscoped.replace(/^artifact-/, ""))];
}

/**
 * Resolves an artifact parameter against the registry.
 *
 * An exact key wins outright. Otherwise the value is matched against each
 * artifact's short forms, and a value matching more than one artifact resolves
 * to nothing — guessing between two registered artifacts would be worse than
 * falling back to the saved or default one.
 */
function resolveArtifact(raw: string, catalog: PlaygroundCatalog): string | undefined {
  const wanted = normalize(raw);
  if (wanted === "") return undefined;

  const exact = catalog.knownApps.find((app) => normalize(app) === wanted);
  if (exact !== undefined) return exact;

  const matches = catalog.knownApps.filter((app) => aliasesFor(app).includes(wanted));
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Resolves a source parameter.
 *
 * The spelling variants cover what the form itself displays — the select shows
 * "prod local" — so a developer copying the label into a URL gets what they
 * meant.
 */
function resolveMode(raw: string, catalog: PlaygroundCatalog): PlaygroundMode | undefined {
  // In a production build the Source field is not rendered, so the parameter is
  // parsed and then discarded rather than silently pinning an invisible value.
  if (!catalog.modeSelectable) return undefined;

  const wanted = normalize(raw);
  if (wanted === "dev") return "dev";
  if (wanted === "prod-local" || wanted === "prod local" || wanted === "prod_local") {
    return "prod-local";
  }
  return undefined;
}

/**
 * Reads the overrides a playground address carries.
 *
 * Unknown or unresolvable values are omitted rather than defaulted, so the layer
 * below (the saved setup, then the defaults) decides that field — a dev-tool
 * address should never dead-end, and the form visibly shows what it did choose
 * (FR-010).
 */
export function parseUrlOverrides(search: string, catalog: PlaygroundCatalog): UrlOverrides {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    return {};
  }

  const overrides: UrlOverrides = {};

  // URLSearchParams.get returns the first occurrence, which is the documented
  // behaviour for a repeated parameter (U-4). A percent sequence that cannot be
  // decoded surfaces here rather than throwing out of the whole parse.
  let artifactParam: string | null = null;
  let sourceParam: string | null = null;
  try {
    artifactParam = params.get(URL_PARAM_ARTIFACT);
    sourceParam = params.get(URL_PARAM_SOURCE);
  } catch {
    return {};
  }

  if (artifactParam !== null) {
    const app = resolveArtifact(artifactParam, catalog);
    if (app !== undefined) overrides.app = app;
  }
  if (sourceParam !== null) {
    const mode = resolveMode(sourceParam, catalog);
    if (mode !== undefined) overrides.mode = mode;
  }

  return overrides;
}
