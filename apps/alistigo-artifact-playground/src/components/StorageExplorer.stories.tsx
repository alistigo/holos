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

export const Empty: Story = {
  args: {
    localEntries: [],
    claudeEntries: [],
  },
};

export const LocalOnly: Story = {
  args: {
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
    claudeEntries: [],
  },
};

export const BothStorages: Story = {
  args: {
    localEntries: [["alistigo:list:lst_abc123", JSON.stringify({ title: "My List", items: [] })]],
    claudeEntries: [
      ["lst_abc123", JSON.stringify({ title: "My List (Claude)", items: [] })],
      ["session/token", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.abc"],
    ],
  },
};
