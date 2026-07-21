/**
 * Per-language bundle build. Set LOCALE=<code> in the environment to
 * pick which Lingui catalog gets baked into the bundle. Defaults to "en".
 *
 * Each locale produces its own bundle in `dist/<locale>/` so the host
 * page can pick the right one based on `navigator.languages` and load it
 * as the iframe's `src`. Switching languages = reloading the iframe with
 * a different `src`. There is no language switcher inside the bundle and
 * no runtime locale state.
 *
 * Add a locale:
 *   1. Add it to `packages/alistigo-list-components-react/lingui.config.ts`.
 *   2. Run `pnpm -F @alistigo/list-components-react i18n:extract`
 *      and translate `src/locales/<new>/messages.po`.
 *   3. Add a `build:<new>` target in this app's project.json.
 */

import path, { resolve } from "node:path";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const LOCALE = process.env.LOCALE ?? "en";

const artifactSrc = path.resolve(__dirname, "../../packages/alistigo-artifact-list/src/index.tsx");

const componentsPackageRoot = path.resolve(
  __dirname,
  "../../packages/alistigo-list-components-react",
);

const activeCatalogPath = path.join(componentsPackageRoot, `src/locales/${LOCALE}/messages.po`);

export default defineConfig({
  base: "./", // relative paths — required for GitHub Pages subpath deployment
  plugins: [
    {
      name: "patch-vite-client-console-debug",
      transform(code, id) {
        if (id.includes("/vite/dist/client/client.mjs")) {
          return {
            code: code.replaceAll("console.debug(", "(console.debug || console.log)("),
            map: null,
          };
        }
        return null;
      },
    },
    react({
      babel: {
        plugins: [linguiMacro],
      },
    }),
    tailwindcss(),
    lingui(),
  ],
  resolve: {
    alias: {
      "@alistigo/artifact-list": artifactSrc,
      "virtual:alistigo-active-catalog": activeCatalogPath,
    },
  },
  define: {
    __ALISTIGO_LOCALE__: JSON.stringify(LOCALE),
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: `dist/${LOCALE}`,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-lingui": ["@lingui/core", "@lingui/react"],
        },
      },
    },
  },
});
