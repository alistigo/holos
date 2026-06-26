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
import { defineConfig, type ViteDevServer } from "vite";

// Claude's iframe CSP — mirrored here so local dev matches production iframe constraints.
// Source: claudeusercontent.com response headers (captured 2026-06).
// Localhost exception: add localhost and 127.0.0.1 to connect-src, script-src, frame-src.
const IFRAME_CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' localhost:* 127.0.0.1:*",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' localhost:* 127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "frame-src 'self' localhost:* 127.0.0.1:*",
  "worker-src blob:",
  "media-src 'self' blob:",
].join("; ");

function iframeCspPlugin() {
  return {
    name: "iframe-csp",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "", "http://x").pathname;
        if (pathname === "/iframe.html") {
          res.setHeader("Content-Security-Policy", IFRAME_CSP);
        }
        next();
      });
    },
  };
}

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
    react({
      babel: {
        plugins: [linguiMacro],
      },
    }),
    tailwindcss(),
    lingui(),
    iframeCspPlugin(),
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
        iframe: resolve(__dirname, "iframe.html"),
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
