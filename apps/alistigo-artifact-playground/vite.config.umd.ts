/**
 * UMD preview mode — serves the pre-built @alistigo/artifact-list UMD bundle
 * and a minimal HTML page that uses auto-mount. No TypeScript compilation.
 *
 * Run via: nx run alistigo-artifact-playground:dev:umd
 * (This target requires alistigo-artifact-list:build to run first.)
 */

import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  plugins: [
    {
      name: "serve-artifact-umd",
      configureServer(server) {
        const umd = path.resolve(
          __dirname,
          "../../packages/alistigo-artifact-list/dist/index.umd.js",
        );
        server.middlewares.use("/index.umd.js", (_req, res) => {
          res.setHeader("Content-Type", "application/javascript");
          const stream = fs.createReadStream(umd);
          stream.on("error", (err: NodeJS.ErrnoException) => {
            if (!res.headersSent) {
              res.statusCode = err.code === "ENOENT" ? 503 : 500;
              res.end(
                "[Alistigo] UMD bundle not found — run: nx run alistigo-artifact-list:build\n",
              );
            }
          });
          stream.pipe(res);
        });
      },
    },
  ],
  server: {
    port: 5174,
    strictPort: false,
    open: "/index.umd.html",
  },
});
