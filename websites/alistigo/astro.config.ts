import os from "node:os";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.alistigo.com",
  server: {
    allowedHosts: [os.hostname(), `${os.hostname()}.local`],
  },
  integrations: [
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
