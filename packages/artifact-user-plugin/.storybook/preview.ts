import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    backgrounds: {
      default: "app",
      values: [
        { name: "app", value: "var(--color-bg)" },
        { name: "white", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
