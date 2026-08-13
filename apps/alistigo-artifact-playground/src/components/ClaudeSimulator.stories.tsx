import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ClaudeSimulator } from "./ClaudeSimulator";

const meta: Meta<typeof ClaudeSimulator> = {
  title: "Components/ClaudeSimulator",
  component: ClaudeSimulator,
  parameters: { layout: "fullscreen" },
  args: {
    aiContext: "",
    simulatorDelayMs: 500,
    onSimulatorDelayChange: fn(),
    suppressResponses: false,
    onSuppressResponsesChange: fn(),
    localEntries: [],
    privateEntries: [],
    sharedEntries: [],
    onDeleteEntry: fn(),
    onSetEntry: fn(),
    onClearSimulatorStorage: fn(),
    aiLogs: [],
    onClearAiLogs: fn(),
    cannedResponse: "",
    onCannedResponseChange: fn(),
    errorMode: false,
    onErrorModeChange: fn(),
    fetchLogs: [],
    onClearFetchLogs: fn(),
    downloadLogs: [],
    onClearDownloadLogs: fn(),
    navLogs: [],
    onClearNavLogs: fn(),
    autoOpen: false,
    onAutoOpenChange: fn(),
    published: false,
    onPublishedChange: fn(),
    onClearData: fn(),
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
