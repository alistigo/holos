import type { Meta, StoryObj } from "@storybook/react-vite";
import HostForm from "./HostForm";

const meta: Meta<typeof HostForm> = {
  title: "Playground/HostForm",
  component: HostForm,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div
        style={{ height: "600px", display: "flex", width: "360px", border: "1px solid #e5e7eb" }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HostForm>;

const defaultConfig = {
  app: "@alistigo/artifact-list",
  lang: "en",
  aiContext: "claude",
  readonly: false,
  document: "",
  rawDocument: "",
  plugins: {},
};

export const ConfigTab: Story = {
  args: {
    config: defaultConfig,
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    storageEntries: [],
  },
};

export const ReadOnly: Story = {
  args: {
    config: { ...defaultConfig, readonly: true },
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    storageEntries: [],
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
    documentNames: ["duplicates", "empty", "groceries"],
    storageEntries: [],
  },
};

export const StorageTabWithData: Story = {
  args: {
    config: defaultConfig,
    onConfigChange: () => {},
    onReload: () => {},
    onClearData: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    storageEntries: [
      ["lst_abc123/items", JSON.stringify([{ id: "1", text: "Buy milk" }])],
      ["lst_abc123/meta", JSON.stringify({ version: 3 })],
    ],
  },
};
