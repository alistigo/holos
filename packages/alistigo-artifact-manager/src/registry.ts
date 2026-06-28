/**
 * Internal artifact registry — maps artifact package names to their CDN URLs.
 *
 * This is the seed registry. Future artifacts can be added here.
 */
export const ARTIFACT_REGISTRY: Record<string, string> = {
  "@alistigo/artifact-list":
    "https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0/dist/index.umd.js",
};
