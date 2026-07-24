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
    entries: [],
  },
};

export const WithEntries: Story = {
  args: {
    entries: [
      [
        "lst_abc123/items",
        JSON.stringify([
          { id: "1", text: "Buy milk" },
          { id: "2", text: "Walk dog" },
        ]),
      ],
      ["lst_abc123/meta", JSON.stringify({ version: 3, lastModified: "2026-07-24T12:00:00Z" })],
      ["lst_abc123/settings", JSON.stringify({ sortOrder: "manual", showCompleted: true })],
    ],
  },
};

export const WithPrimitiveValue: Story = {
  args: {
    entries: [
      ["session/token", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.abc"],
      ["session/count", "42"],
    ],
  },
};
