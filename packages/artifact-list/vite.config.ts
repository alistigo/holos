/**
 * ES module build for @alistigo/artifact-list.
 *
 * React (bare "react" / "react/jsx-runtime") is externalized — provided by the
 * host page via an import map pointing at jsDelivr. react-dom is intentionally
 * bundled so rollup converts its internal require('react') to a bare import,
 * ensuring the artifact, bundled react-dom, and any plugins all share one
 * React instance through the same import-map URL.
 *
 * The active locale is baked at build time via LOCALE env var (default: en).
 * The virtual:alistigo-active-catalog alias maps to the actual .po file so
 * the Lingui vite plugin can compile it at bundle time.
 *
 * CSS (Tailwind v4 + Radix Colors) is injected into the JS at build time.
 */

import path from "node:path";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const LOCALE = process.env.LOCALE ?? "en";
const componentsRoot = path.resolve(__dirname, "../../packages/list-components-react");
const activeCatalogPath = path.join(componentsRoot, `src/locales/${LOCALE}/messages.po`);

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [linguiMacro] } }),
    tailwindcss(),
    lingui(),
    cssInjectedByJsPlugin(),
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
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Only bare React is externalized — provided by the host page import map.
      // react-dom is bundled so rollup converts its internal require('react') to a
      // bare import, ensuring all consumers share one React instance via the import map.
      external: ["react", "react/jsx-runtime"],
    },
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: false,
  },
});
