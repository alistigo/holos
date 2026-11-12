/**
 * Self-contained ES module build for @alistigo/local-storage-plugin.
 *
 * Bundles all workspace deps into one dependency-free file so
 * @alistigo/artifact-plugin-api's loader can `await import()` it directly from a
 * jsDelivr URL with zero import map.
 */

import { definePluginConfig } from "@alistigo/artifact-dev-tools";

export default definePluginConfig(__dirname);
