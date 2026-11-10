/**
 * ES module build for @alistigo/artifact-list.
 *
 * React is externalized — it must be provided by the host page via an import
 * map pointing at jsDelivr (or equivalent CDN). This ensures the artifact
 * and any dynamically-loaded plugins share one React instance.
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
      // React is provided by the host page import map — do not bundle it.
      external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    },
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: false,
  },
});
