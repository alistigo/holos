import type { Meta, StoryObj } from "@storybook/react-vite";
import { StorageSection } from "./StorageSection.js";

const meta: Meta<typeof StorageSection> = {
  title: "Explorer/StorageSection",
  component: StorageSection,
  decorators: [
    (Story) => (
      <div className="h-80 w-2xl border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StorageSection>;

const SAMPLE_ENTRIES: Record<string, unknown> = {
  "alistigo:list:abc123": {
    id: "list:abc123",
    items: [
      { id: "item:1", text: "Buy milk", done: false },
      { id: "item:2", text: "Walk the dog", done: true },
    ],
  },
  "alistigo:list:def456": { id: "list:def456", items: [] },
  "alistigo:prefs:user": { locale: "en", theme: "light" },
};

export const WithEntries: Story = {
  args: {
    label: "Private",
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: (key) => alert(`delete: ${key}`),
    isDeletingKey: null,
  },
};

export const Deleting: Story = {
  args: {
    label: "Private",
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: () => {},
    isDeletingKey: "alistigo:list:abc123",
  },
};

export const Loading: Story = {
  args: {
    label: "Shared",
    entries: {},
    isLoading: true,
    onDelete: () => {},
    isDeletingKey: null,
  },
};

export const Empty: Story = {
  args: {
    label: "Shared",
    entries: {},
    isLoading: false,
    onDelete: () => {},
    isDeletingKey: null,
  },
};
