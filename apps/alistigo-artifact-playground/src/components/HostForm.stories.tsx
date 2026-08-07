import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ClaudeSimulatorProps } from "./ClaudeSimulator";
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
  published: false,
};

const noopSimulator: ClaudeSimulatorProps = {
  aiContext: "claude",
  simulatorDelayMs: 0,
  onSimulatorDelayChange: () => {},
  suppressResponses: false,
  onSuppressResponsesChange: () => {},
  localEntries: [],
  privateEntries: [],
  sharedEntries: [],
  onDeleteEntry: () => {},
  onSetEntry: () => {},
  onClearSimulatorStorage: () => {},
  aiLogs: [],
  onClearAiLogs: () => {},
  cannedResponse: "Simulated response.",
  onCannedResponseChange: () => {},
  errorMode: false,
  onErrorModeChange: () => {},
  fetchLogs: [],
  onClearFetchLogs: () => {},
  downloadLogs: [],
  onClearDownloadLogs: () => {},
  navLogs: [],
  onClearNavLogs: () => {},
  autoOpen: false,
  onAutoOpenChange: () => {},
  published: false,
  onPublishedChange: () => {},
  onClearData: () => {},
};

export const ConfigTab: Story = {
  args: {
    config: defaultConfig,
    onConfigChange: () => {},
    onReload: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    simulator: noopSimulator,
  },
};

export const ReadOnly: Story = {
  args: {
    config: { ...defaultConfig, readonly: true },
    onConfigChange: () => {},
    onReload: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    simulator: noopSimulator,
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
    documentNames: ["duplicates", "empty", "groceries"],
    simulator: noopSimulator,
  },
};

export const StorageTabWithData: Story = {
  args: {
    config: defaultConfig,
    onConfigChange: () => {},
    onReload: () => {},
    documentNames: ["duplicates", "empty", "groceries"],
    simulator: {
      ...noopSimulator,
      privateEntries: [
        ["lst_abc123/items", JSON.stringify([{ id: "1", text: "Buy milk" }])],
        ["lst_abc123/meta", JSON.stringify({ version: 3 })],
      ],
      sharedEntries: [["shared/config", JSON.stringify({ theme: "dark" })]],
    },
  },
};
