import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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

const SAMPLE_KEYS = [
  "alistigo:list:abc123",
  "alistigo:list:def456",
  "alistigo:prefs:user",
  "alistigo:prefs:theme",
];

function InteractiveKeyList(args: React.ComponentProps<typeof KeyList>): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  return <KeyList {...args} selectedKey={selected} onSelectKey={setSelected} />;
}

export const Default: Story = {
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    keys: SAMPLE_KEYS,
    label: "Private",
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    keys: [],
    selectedKey: null,
    onSelectKey: () => {},
    label: "Private",
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    keys: [],
    selectedKey: null,
    onSelectKey: () => {},
    label: "Shared",
    isLoading: false,
    emptyText: "No shared keys found.",
  },
};

export const WithSelection: Story = {
  args: {
    keys: SAMPLE_KEYS,
    selectedKey: "alistigo:list:abc123",
    onSelectKey: () => {},
    label: "Private",
    isLoading: false,
  },
};
