/**
 * ES module build for @alistigo/artifact-list.
 *
 * React is fully bundled — no CDN import map needed. After module evaluation
 * React is exposed on globalThis.__ALISTIGO_REACT__ so dynamically-loaded
 * plugins can reference the same instance without bundling their own copy.
 *
 * The active locale is baked at build time via LOCALE env var (default: en).
 * The virtual:alistigo-active-catalog alias maps to the actual .po file so
 * the Lingui vite plugin can compile it at bundle time.
 *
 * CSS (Tailwind v4 + Radix Colors) is injected into the JS at build time.
 */

import path from "node:path";
import { defineApplicationConfig } from "@alistigo/artifact-dev-tools";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const LOCALE = process.env.LOCALE ?? "en";
const componentsRoot = path.resolve(__dirname, "../../packages/list-components-react");
const activeCatalogPath = path.join(componentsRoot, `src/locales/${LOCALE}/messages.po`);

export default defineApplicationConfig(__dirname, {
  entry: "src/index.tsx",
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
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
    "import.meta.env.VITE_LOCALE": JSON.stringify(LOCALE),
  },
});
