export type { KnownArtifactName } from "./artifacts.js";
export { KNOWN_ARTIFACTS } from "./artifacts.js";
export type { ArtifactConfig } from "./types.js";
export { validateArtifactConfig } from "./validate.js";

import artifactConfigSchemaJson from "./schemas/artifact-config.json" with { type: "json" };
export const artifactConfigSchema = artifactConfigSchemaJson;

// @public
