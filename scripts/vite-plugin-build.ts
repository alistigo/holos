import path from "node:path";
import { defineConfig } from "vite";

export function definePluginConfig(dirname: string) {
  return defineConfig({
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    build: {
      lib: {
        entry: path.resolve(dirname, "src/index.ts"),
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
}
