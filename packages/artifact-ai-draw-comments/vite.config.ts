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
  resolve: {
    // Bypass the full `import 'konva'` in react-konva's default entry.
    // ReactKonvaCore uses konva/lib/Core.js only; shapes are registered explicitly in DrawCanvas.tsx.
    alias: {
      "react-konva": path.resolve(__dirname, "node_modules/react-konva/es/ReactKonvaCore.js"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "AiDrawComments",
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
