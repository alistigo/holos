import { lingui } from "@lingui/vite-plugin";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: false,
  },
  async viteFinal(viteConfig) {
    // Tailwind v4 + Lingui's Vite plugin (so `.po` imports resolve).
    // Babel macro transformation in Storybook is a follow-up — stories
    // currently render English source text via Lingui's runtime fallback.
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss(), lingui()];
    return viteConfig;
  },
};

export default config;
