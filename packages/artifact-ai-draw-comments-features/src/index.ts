/**
 * @alistigo/artifact-ai-draw-comments-features
 *
 * The directories the features runner reads. Resolved relative to the built
 * `dist/` so they are correct after packaging as well as in the workspace.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __distDir = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the directory holding this package's `.feature` files. */
export const FEATURES_DIR = path.resolve(__distDir, "..", "features");

/** Absolute path to the compiled step definitions (dist/step-definitions/). */
export const STEP_DEFINITIONS_DIR = path.resolve(__distDir, "step-definitions");

/**
 * Absolute path to the compiled domain support code (dist/support/) — the
 * World subclass and page object for this widget. The generic browser harness
 * lives in the runner, not here.
 */
export const SUPPORT_DIR = path.resolve(__distDir, "support");
