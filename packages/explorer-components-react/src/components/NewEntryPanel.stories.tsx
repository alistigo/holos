import type { Meta, StoryObj } from "@storybook/react-vite";
import { NewEntryPanel } from "./NewEntryPanel.js";

const meta: Meta<typeof NewEntryPanel> = {
  title: "Explorer/NewEntryPanel",
  component: NewEntryPanel,
  decorators: [
    (Story) => (
      <div className="h-[28rem] w-96 border border-gray-200 rounded overflow-hidden flex flex-col bg-white">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NewEntryPanel>;

const EXISTING: { key: string; shared: boolean }[] = [
  { key: "my-doc", shared: false },
  { key: "shared-prefs", shared: true },
];

export const FileTab: Story = {
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
};

export const TextTabJson: Story = {
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async (key, text) => {
      alert(`create: ${key}\n${text}`);
    },
    onCancel: () => {},
  },
};

export const NoExistingKeys: Story = {
  args: {
    existingEntries: [],
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
};
