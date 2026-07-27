export interface ArtifactEntry {
  cdnUrl: string;
  skillPackage: string;
  /** Plugin npm package names this artifact type can load via config.plugins. */
  availablePlugins: string[];
}

/**
 * Internal artifact registry — maps artifact package names to their CDN URL, skill
 * package, and the plugins that can be enabled on them.
 *
 * This is the seed registry. Future artifacts can be added here.
 */
export const ARTIFACT_REGISTRY: Record<string, ArtifactEntry> = {
  "@alistigo/artifact-list": {
    cdnUrl: "https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0/dist/index.umd.js",
    skillPackage: "@alistigo/artifact-list-skill",
    availablePlugins: ["@alistigo/artifact-sentry-plugin", "@alistigo/artifact-posthog-plugin"],
  },
};
