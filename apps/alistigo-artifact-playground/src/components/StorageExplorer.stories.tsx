import type { Meta, StoryObj } from "@storybook/react-vite";
import { StorageExplorer } from "./StorageExplorer";

const meta: Meta<typeof StorageExplorer> = {
  title: "Playground/StorageExplorer",
  component: StorageExplorer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "400px", display: "flex", border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StorageExplorer>;

export const LocalEmpty: Story = {
  args: {
    aiContext: "none",
    localEntries: [],
    privateEntries: [],
    sharedEntries: [],
  },
};

export const LocalWithEntries: Story = {
  args: {
    aiContext: "none",
    localEntries: [
      [
        "alistigo:list:lst_abc123",
        JSON.stringify([
          { id: "1", text: "Buy milk" },
          { id: "2", text: "Walk dog" },
        ]),
      ],
      [
        "alistigo:list:lst_abc123/meta",
        JSON.stringify({ version: 3, lastModified: "2026-07-24T12:00:00Z" }),
      ],
    ],
    privateEntries: [],
    sharedEntries: [],
  },
};

export const ClaudeEmpty: Story = {
  args: {
    aiContext: "claude",
    localEntries: [],
    privateEntries: [],
    sharedEntries: [],
    onDeleteEntry: () => {},
    onSetEntry: () => {},
    onClearAll: () => {},
  },
};

export const ClaudeWithEntries: Story = {
  args: {
    aiContext: "claude",
    localEntries: [],
    privateEntries: [
      ["lst_abc123", JSON.stringify({ title: "My List (Claude)", items: [] })],
      ["session/token", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.abc"],
    ],
    sharedEntries: [
      ["shared/config", JSON.stringify({ theme: "dark", lang: "en" })],
    ],
    onDeleteEntry: () => {},
    onSetEntry: () => {},
    onClearAll: () => {},
  },
};
