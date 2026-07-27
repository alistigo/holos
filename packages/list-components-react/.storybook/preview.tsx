import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { Decorator, Preview, ReactRenderer } from "@storybook/react-vite";
import { messages as enMessages } from "../src/locales/en/messages.po";
import "../src/styles/globals.css";

i18n.load("en", enMessages);
i18n.activate("en");

const withI18n: Decorator<ReactRenderer> = (Story) => (
  <I18nProvider i18n={i18n}>
    <Story />
  </I18nProvider>
);

const preview: Preview = {
  decorators: [withI18n],
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
