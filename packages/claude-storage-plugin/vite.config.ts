/**
 * Self-contained ES module build for @alistigo/claude-storage-plugin.
 *
 * Bundles all dependencies into one dependency-free file so the artifact's
 * plugin loader can `await import()` it directly from a jsDelivr URL with
 * zero import map.
 */

import { definePluginConfig } from "../../scripts/vite-plugin-build.ts";

export default definePluginConfig(__dirname);
