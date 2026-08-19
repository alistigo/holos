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
    // Tailwind v4 via the Vite plugin — required for workspace CSS preset.
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
