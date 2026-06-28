/**
 * UMD bundle config for @alistigo/artifact-manager.
 *
 * Bundles everything (including @alistigo/artifact-config-format and
 * @alistigo/artifact-config-list-format) into one self-contained UMD file —
 * no external dependencies required.
 */

import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/umd-entry.ts"),
      name: "AlistigoArtifactManager",
      formats: ["umd"],
      fileName: () => "index.umd.js",
    },
    // Bundle all dependencies — produce a self-contained UMD file
    rollupOptions: {
      external: [],
    },
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
    emptyOutDir: false,
  },
});
