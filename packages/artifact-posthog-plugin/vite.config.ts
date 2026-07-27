/**
 * Self-contained ES module build for @alistigo/artifact-posthog-plugin.
 *
 * Bundles posthog-js and @alistigo/logger into one dependency-free file so
 * @alistigo/artifact-plugin-api's loader can `await import()` it directly from a
 * jsDelivr URL with zero import map.
 */

import { definePluginConfig } from "../../scripts/vite-plugin-build.ts";

export default definePluginConfig(__dirname);
