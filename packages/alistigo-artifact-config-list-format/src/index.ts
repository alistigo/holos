export type { ListArtifactConfig } from "./types.js";
export { validateListConfig } from "./validate.js";

import listConfigSchemaJson from "./schemas/list-config.json" with { type: "json" };
export const listConfigSchema = listConfigSchemaJson;

// @public
