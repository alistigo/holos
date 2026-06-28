/**
 * @alistigo/features
 *
 * Public surface of the package. Consumers (the runner, CI, anything that
 * needs to enumerate or filter feature scenarios) import from here.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export * from "./tags.js";

/**
 * Absolute path to the directory containing all `.feature` files in this
 * package. Resolved relative to the published `dist/` so it works after build.
 */
export const FEATURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "features",
);
