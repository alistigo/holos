/**
 * UMD bundle config for @alistigo/artifact-list.
 *
 * Bundles everything (React, Lingui, all Alistigo packages) into one
 * self-contained UMD file — no external dependencies.
 *
 * The active locale is baked at build time via LOCALE env var (default: en).
 * The virtual:alistigo-active-catalog alias maps to the actual .po file so
 * the Lingui vite plugin can compile it at bundle time.
 *
 * CSS (Tailwind v4 + Radix Colors) is injected into the UMD file at build
 * time so the bundle is truly self-contained.
 */

import path from "node:path";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";
import { lingui } from "@lingui/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const LOCALE = process.env.LOCALE ?? "en";
const componentsRoot = path.resolve(__dirname, "../../packages/alistigo-list-components-react");
const activeCatalogPath = path.join(componentsRoot, `src/locales/${LOCALE}/messages.po`);

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [linguiMacro] } }),
    tailwindcss(),
    lingui(),
    cssInjectedByJsPlugin(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG ?? "alistigo",
            project: process.env.SENTRY_PROJECT ?? "alistigo-artifact-list",
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "virtual:alistigo-active-catalog": activeCatalogPath,
    },
  },
  define: {
    __ALISTIGO_LOCALE__: JSON.stringify(LOCALE),
    "process.env.NODE_ENV": JSON.stringify("production"),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
    "import.meta.env.VITE_LOCALE": JSON.stringify(LOCALE),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "Alistigo",
      formats: ["umd"],
      fileName: () => "index.umd.js",
    },
    // Bundle everything — no external deps; self-contained artifact
    rollupOptions: {},
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: false,
  },
});
