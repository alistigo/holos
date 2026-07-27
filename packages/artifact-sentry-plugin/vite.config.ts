/**
 * Self-contained ES module build for @alistigo/artifact-sentry-plugin.
 *
 * Bundles @sentry/browser and @alistigo/logger into one dependency-free file so
 * @alistigo/artifact-plugin-api's loader can `await import()` it directly from a
 * jsDelivr URL with zero import map.
 */

import path from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG ?? "alistigo",
            project: process.env.SENTRY_PROJECT ?? "alistigo-artifact-sentry-plugin",
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    // Bundle everything — no external deps; must be `await import()`-able with
    // zero bare-specifier imports left in the output.
    rollupOptions: {},
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
  },
});
