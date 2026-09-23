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
      description:
        "Platform for embeddable AI artifacts — interactive list widgets for any AI chat.",
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
          items: [
            { label: "What is Alistigo?", slug: "about/what-is-alistigo" },
          ],
        },
        {
          label: "Platform",
          items: [
            { label: "Overview", slug: "platform/overview" },
            { label: "Architecture", slug: "platform/architecture" },
            { label: "Layer Model", slug: "platform/layer-diagram" },
          ],
        },
        {
          label: "Architecture Decisions",
          items: [{ label: "All ADRs", slug: "adrs" }],
        },
        {
          label: "Playground",
          items: [{ label: "Open Playground", slug: "playground" }],
        },
      ],
    }),
  ],
});
