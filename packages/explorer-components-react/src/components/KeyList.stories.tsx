import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { KeyListEntry } from "./KeyList.js";
import { KeyList } from "./KeyList.js";

const meta: Meta<typeof KeyList> = {
  title: "Explorer/KeyList",
  component: KeyList,
  decorators: [
    (Story) => (
      <div className="h-64 w-48 border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KeyList>;

const SAMPLE_ENTRIES: KeyListEntry[] = [
  { id: "p:alistigo:list:abc123", label: "alistigo:list:abc123", isShared: false },
  { id: "p:alistigo:list:def456", label: "alistigo:list:def456", isShared: false },
  { id: "s:alistigo:prefs:user", label: "alistigo:prefs:user", isShared: true },
  { id: "p:alistigo:prefs:theme", label: "alistigo:prefs:theme", isShared: false },
];

function InteractiveKeyList(args: React.ComponentProps<typeof KeyList>): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <KeyList {...args} selectedId={selectedId} onSelectId={setSelectedId} />;
}

export const Default: Story = {
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "Keys",
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    entries: [],
    selectedId: null,
    onSelectId: () => {},
    label: "Keys",
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    selectedId: null,
    onSelectId: () => {},
    label: "Keys",
    isLoading: false,
    emptyText: "No keys found.",
  },
};

export const WithSelection: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    selectedId: "p:alistigo:list:abc123",
    onSelectId: () => {},
    label: "Keys",
    isLoading: false,
  },
};
