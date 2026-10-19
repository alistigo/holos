import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import starlight from "@astrojs/starlight";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";

function archifyStaticFiles(): AstroIntegration {
  const req = createRequire(import.meta.url);
  let destDir: URL;
  let calmDestDir: URL;
  let archSystemsDir: string;

  function copyArchifyFrom(sourceDir: string): void {
    if (!existsSync(sourceDir)) return;
    for (const file of readdirSync(sourceDir)) {
      if (file.endsWith(".archify.html")) {
        copyFileSync(path.join(sourceDir, file), new URL(file, destDir).pathname);
      }
    }
  }

  function copyCalmFrom(sourceDir: string): void {
    if (!existsSync(sourceDir)) return;
    for (const file of readdirSync(sourceDir)) {
      if (file.endsWith(".arch.calm.json")) {
        copyFileSync(path.join(sourceDir, file), new URL(file, calmDestDir).pathname);
      }
    }
  }

  return {
    name: "archify-static-files",
    hooks: {
      "astro:config:setup": ({ config }) => {
        destDir = new URL("public/archify/", config.root);
        mkdirSync(destDir, { recursive: true });
        calmDestDir = new URL("public/calm/", config.root);
        mkdirSync(calmDestDir, { recursive: true });

        const archPkg = req.resolve("@alistigo/architecture/package.json");
        archSystemsDir = path.join(path.dirname(archPkg), "systems");
        copyArchifyFrom(archSystemsDir);
        copyCalmFrom(archSystemsDir);

        const listPkg = req.resolve("@alistigo/list-domain/package.json");
        copyArchifyFrom(path.dirname(listPkg));
      },

      "astro:server:setup": ({ server }) => {
        server.watcher.add(archSystemsDir);
        server.watcher.on("change", (file: string) => {
          if (file.endsWith(".archify.html")) {
            copyFileSync(file, new URL(path.basename(file), destDir).pathname);
            server.ws.send({ type: "full-reload" });
          } else if (file.endsWith(".arch.calm.json")) {
            copyFileSync(file, new URL(path.basename(file), calmDestDir).pathname);
          }
        });
      },
    },
  };
}

export default defineConfig({
  site: "https://www.alistigo.com",
  server: {
    allowedHosts: [os.hostname(), `${os.hostname()}.local`],
  },
  integrations: [
    archifyStaticFiles(),
    starlight({
      title: "Alistigo",
      logo: {
        src: "./src/assets/logo.svg",
        alt: "Alistigo",
      },
      favicon: "/favicon.svg",
      description:
        "Framework and collection of embeddable AI artifacts — interactive list widgets for any AI chat.",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/alistigo/holos",
        },
      ],
      sidebar: [
        {
          label: "About",
          items: [{ label: "What is Alistigo?", slug: "about/what-is-alistigo" }],
        },
        {
          label: "Framework",
          items: [
            { label: "Architecture", slug: "framework/architecture" },
            { label: "Design Principles", slug: "framework/design-principles" },
          ],
        },
        {
          label: "Artifacts",
          items: [{ label: "Artifact Catalog", slug: "artifacts" }],
        },
        {
          label: "AI-Assisted Engineering",
          items: [{ label: "artifact-arch-check", slug: "tools/artifact-arch-check" }],
        },
        {
          label: "Architecture Decisions",
          items: [{ label: "All ADRs", link: "/adrs/" }],
        },
        {
          label: "Playground",
          items: [{ label: "Open Playground", slug: "playground" }],
        },
      ],
    }),
  ],
});
