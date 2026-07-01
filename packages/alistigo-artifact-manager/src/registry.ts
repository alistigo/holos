export interface ArtifactEntry {
  cdnUrl: string;
  skillPackage: string;
}

/**
 * Internal artifact registry — maps artifact package names to their CDN URL and skill package.
 *
 * This is the seed registry. Future artifacts can be added here.
 */
export const ARTIFACT_REGISTRY: Record<string, ArtifactEntry> = {
  "@alistigo/artifact-list": {
    cdnUrl: "https://cdn.jsdelivr.net/npm/@alistigo/artifact-list@0/dist/index.umd.js",
    skillPackage: "@alistigo/artifact-list-skill",
  },
};
