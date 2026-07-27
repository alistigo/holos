export const KNOWN_ARTIFACTS = ["@alistigo/artifact-list"] as const;
export type KnownArtifactName = (typeof KNOWN_ARTIFACTS)[number];
