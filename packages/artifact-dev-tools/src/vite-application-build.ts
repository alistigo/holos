import path from "node:path";
import type { Plugin, UserConfig } from "vite";
import { defineConfig } from "vite";

export interface ApplicationBuildOptions {
  /** Entry point relative to dirname. Defaults to "src/index.ts". */
  entry?: string;
  /** Vite plugins (React, Tailwind, Lingui, etc.). */
  plugins?: Plugin[];
  resolve?: UserConfig["resolve"];
  /** Extra define values merged on top of the default NODE_ENV=production. */
  define?: Record<string, string>;
  rollupOptions?: NonNullable<UserConfig["build"]>["rollupOptions"];
}

export function defineApplicationConfig(dirname: string, options?: ApplicationBuildOptions) {
  const config: UserConfig = {
    plugins: options?.plugins ?? [],
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      ...options?.define,
    },
    build: {
      lib: {
        entry: path.resolve(dirname, options?.entry ?? "src/index.ts"),
        formats: ["es"],
        fileName: () => "index.js",
      },
      rollupOptions: options?.rollupOptions ?? {},
      outDir: "dist",
      minify: "esbuild",
      sourcemap: true,
      cssCodeSplit: false,
    },
  };
  if (options?.resolve !== undefined) {
    config.resolve = options.resolve;
  }
  return defineConfig(config);
}
