/**
 * Library build config. Switched from `tsc` to `vite build --lib` so the
 * Lingui Babel macro plugin (`@lingui/babel-plugin-lingui-macro`) can run
 * across the components and resolve `t\`...\`` / `<Trans>` calls into
 * `i18n._()` calls at build time.
 *
 * Type emit is delegated to `tsc -p tsconfig.build.json --emitDeclarationOnly`
 * which the npm `build` script chains after this Vite build.
 */

import path from "node:path";
import linguiMacro from "@lingui/babel-plugin-lingui-macro";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [linguiMacro],
      },
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^@lingui\//,
        /^@radix-ui\//,
        /^@alistigo\//,
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "motion",
        "motion/react",
        "tailwind-merge",
        "vaul",
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
