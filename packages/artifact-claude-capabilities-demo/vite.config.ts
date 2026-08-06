import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), tailwindcss(), cssInjectedByJsPlugin()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "AlistigoClaudeCapabilitiesDemo",
      formats: ["umd"],
      fileName: () => "index.umd.js",
    },
    rollupOptions: {},
    outDir: "dist",
    minify: "esbuild",
    sourcemap: true,
    cssCodeSplit: false,
  },
});
