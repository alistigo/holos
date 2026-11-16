/**
 * @alistigo/features
 *
 * Public surface of the package. Consumers (the runner, CI, anything that
 * needs to enumerate or filter feature scenarios) import from here.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export * from "./tags.js";

const __distDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the directory containing all `.feature` files in this
 * package. Resolved relative to the published `dist/` so it works after build.
 */
export const FEATURES_DIR = path.resolve(__distDir, "..", "features");

/**
 * Absolute path to the compiled step definitions directory (dist/step-definitions/).
 * Used by artifact-features-runner-playwright to load step implementations.
 */
export const STEP_DEFINITIONS_DIR = path.resolve(__distDir, "step-definitions");

/**
 * Absolute path to the compiled support directory (dist/support/).
 * Contains the World class, before/after hooks, and helpers loaded by the runner.
 */
export const SUPPORT_DIR = path.resolve(__distDir, "support");
