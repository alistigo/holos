/**
 * Self-contained ES module build for @alistigo/artifact-user-plugin.
 *
 * Bundles jdenticon, @alistigo/logger, and React components into one
 * dependency-free file so @alistigo/artifact-plugin-api's loader can
 * `await import()` it directly from a jsDelivr URL with zero import map.
 */

import { definePluginConfig } from "../../scripts/vite-plugin-build.ts";

export default definePluginConfig(__dirname);
