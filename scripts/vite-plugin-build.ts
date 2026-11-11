import path from "node:path";
import type { Plugin } from "rollup";
import { defineConfig } from "vite";

interface PluginBuildOptions {
  /** Packages to leave as bare-specifier imports rather than bundling. Use for peer dependencies. */
  external?: string[];
  /** Additional Rollup plugins applied during build (e.g. rollup-plugin-external-globals). */
  rollupPlugins?: Plugin[];
}

export function definePluginConfig(dirname: string, options?: PluginBuildOptions) {
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
      rollupOptions: {
        external: options?.external ?? [],
        plugins: options?.rollupPlugins,
      },
      outDir: "dist",
      minify: "esbuild",
      sourcemap: true,
    },
  });
}
