import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import starlight from "@astrojs/starlight";
import type { AstroIntegration } from "astro";
import { defineConfig } from "astro/config";

function archifyStaticFiles(): AstroIntegration {
  return {
    name: "archify-static-files",
    hooks: {
      "astro:config:setup": ({ config }) => {
        const req = createRequire(import.meta.url);
        const destDir = new URL("public/archify/", config.root);
        mkdirSync(destDir, { recursive: true });

        function copyArchifyFrom(sourceDir: string): void {
          if (!existsSync(sourceDir)) return;
          for (const file of readdirSync(sourceDir)) {
            if (file.endsWith(".archify.html")) {
              copyFileSync(path.join(sourceDir, file), new URL(file, destDir).pathname);
            }
          }
        }

        const archPkg = req.resolve("@alistigo/architecture/package.json");
        copyArchifyFrom(path.join(path.dirname(archPkg), "systems"));

        const listPkg = req.resolve("@alistigo/list-domain/package.json");
        copyArchifyFrom(path.dirname(listPkg));
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
            { label: "Overview", slug: "framework/overview" },
            { label: "Architecture", slug: "framework/architecture" },
            { label: "Artifact Pattern", slug: "framework/alistigo-artifact-pattern" },
            { label: "List Artifact Architecture", slug: "framework/artifact-architecture" },
            { label: "Layer Model", slug: "framework/layer-diagram" },
          ],
        },
        {
          label: "Artifacts",
          items: [{ label: "Artifact Catalog", slug: "artifacts" }],
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
