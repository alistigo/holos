import type { Meta, StoryObj } from "@storybook/react-vite";
import type { UnifiedEntry } from "./StorageSection.js";
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

const SAMPLE_ENTRIES: UnifiedEntry[] = [
  {
    key: "alistigo:list:abc123",
    value: {
      id: "list:abc123",
      items: [
        { id: "item:1", text: "Buy milk", done: false },
        { id: "item:2", text: "Walk the dog", done: true },
      ],
    },
    shared: false,
  },
  { key: "alistigo:list:def456", value: { id: "list:def456", items: [] }, shared: false },
  { key: "alistigo:prefs:user", value: { locale: "en", theme: "light" }, shared: true },
];

export const WithEntries: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: (key, shared) => alert(`delete: ${key} (shared=${String(shared)})`),
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Deleting: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: { key: "alistigo:list:abc123", shared: false },
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    isLoading: true,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    isLoading: false,
    onDelete: () => {},
    isDeletingEntry: null,
    onCreate: async () => {},
    onUpdate: async () => {},
    onCreateText: async () => {},
  },
};
