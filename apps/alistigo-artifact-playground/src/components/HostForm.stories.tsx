import type { Meta, StoryObj } from "@storybook/react-vite";
import HostForm from "./HostForm";

const meta: Meta<typeof HostForm> = {
  title: "Dev/HostForm",
  component: HostForm,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof HostForm>;

const defaultConfig = {
  app: "@alistigo/artifact-list",
  lang: "en",
  aiContext: "claude",
  readonly: false,
  plugins: {},
};

export const Default: Story = {
  args: {
    config: defaultConfig,
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    config: { ...defaultConfig, readonly: true },
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
  },
};

export const WithPluginsEnabled: Story = {
  args: {
    config: {
      ...defaultConfig,
      plugins: {
        "@alistigo/artifact-sentry-plugin": {},
        "@alistigo/artifact-posthog-plugin": {},
      },
    },
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
  },
};
