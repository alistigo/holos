import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClaudeSimulator } from "./ClaudeSimulator";

const noop = () => {};

const meta: Meta<typeof ClaudeSimulator> = {
  title: "Components/ClaudeSimulator",
  component: ClaudeSimulator,
  parameters: { layout: "fullscreen" },
  args: {
    aiContext: "",
    simulatorDelayMs: 500,
    onSimulatorDelayChange: noop,
    suppressResponses: false,
    onSuppressResponsesChange: noop,
    localEntries: [],
    privateEntries: [],
    sharedEntries: [],
    onDeleteEntry: noop,
    onSetEntry: noop,
    onClearSimulatorStorage: noop,
    aiLogs: [],
    onClearAiLogs: noop,
    cannedResponse: "",
    onCannedResponseChange: noop,
    errorMode: false,
    onErrorModeChange: noop,
    fetchLogs: [],
    onClearFetchLogs: noop,
    downloadLogs: [],
    onClearDownloadLogs: noop,
    navLogs: [],
    onClearNavLogs: noop,
    autoOpen: false,
    onAutoOpenChange: noop,
    published: false,
    onPublishedChange: noop,
    onClearData: noop,
  },
};

export default meta;
type Story = StoryObj<typeof ClaudeSimulator>;

export const Empty: Story = {};

export const WithStorageEntries: Story = {
  args: {
    privateEntries: [
      ["user-prefs", JSON.stringify({ theme: "dark" })],
      ["recent", JSON.stringify(["item-a", "item-b"])],
    ],
    sharedEntries: [["banner", JSON.stringify({ text: "Hello world" })]],
  },
};
