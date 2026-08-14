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

const ENTRIES_WITH_BADGES: KeyListEntry[] = [
  { id: "p:avatar.jpg", label: "avatar.jpg", isShared: false, fileTypeBadge: "JPG" },
  { id: "p:screenshot.png", label: "screenshot.png", isShared: false, fileTypeBadge: "PNG" },
  { id: "p:report.pdf", label: "report.pdf", isShared: false, fileTypeBadge: "PDF" },
  { id: "s:banner.webp", label: "banner.webp", isShared: true, fileTypeBadge: "WEBP" },
  { id: "p:config", label: "config", isShared: false, fileTypeBadge: "JSON" },
  { id: "p:manifest", label: "manifest", isShared: false, fileTypeBadge: "YAML" },
  { id: "p:alistigo:list:abc123", label: "alistigo:list:abc123", isShared: false },
];

function InteractiveKeyList(args: React.ComponentProps<typeof KeyList>): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <KeyList {...args} selectedId={selectedId} onSelectId={setSelectedId} />;
}

// ── Basic states ──────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "4 keys",
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
    label: "0 keys",
    isLoading: false,
    emptyText: "No keys found.",
  },
};

export const WithSelection: Story = {
  args: {
    entries: SAMPLE_ENTRIES,
    selectedId: "p:alistigo:list:abc123",
    onSelectId: () => {},
    label: "4 keys",
    isLoading: false,
  },
};

// ── Feature variants ──────────────────────────────────────────────────────────

export const WithTypeBadges: Story = {
  name: "With file and document type badges",
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: ENTRIES_WITH_BADGES,
    label: "7 keys",
    isLoading: false,
  },
};

export const WithDeleteButton: Story = {
  name: "With delete button",
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "4 keys",
    isLoading: false,
    onDeleteId: (id) => alert(`delete: ${id}`),
  },
};

export const WithDeleteInProgress: Story = {
  name: "With delete in progress",
  args: {
    entries: SAMPLE_ENTRIES,
    selectedId: null,
    onSelectId: () => {},
    label: "4 keys",
    isLoading: false,
    onDeleteId: () => {},
    isDeletingId: "p:alistigo:list:def456",
  },
};

export const WithStatusBadges: Story = {
  name: "With draft / saving status badges",
  args: {
    entries: SAMPLE_ENTRIES,
    selectedId: "p:alistigo:list:abc123",
    onSelectId: () => {},
    label: "4 keys",
    isLoading: false,
    entryStatuses: new Map([
      ["p:alistigo:list:abc123", "draft"],
      ["s:alistigo:prefs:user", "saving"],
    ]),
  },
};

export const WithCreateButton: Story = {
  name: "With + New button",
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "4 keys",
    isLoading: false,
    onCreateClick: () => alert("new entry"),
  },
};

export const WithReloadButton: Story = {
  name: "With Reload button",
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "4 keys",
    isLoading: false,
    onReloadClick: () => alert("reload"),
  },
};

export const WithAllButtons: Story = {
  name: "With + New and Reload buttons",
  render: (args) => <InteractiveKeyList {...args} />,
  args: {
    entries: SAMPLE_ENTRIES,
    label: "4 keys",
    isLoading: false,
    onCreateClick: () => alert("new entry"),
    onReloadClick: () => alert("reload"),
    onDeleteId: (id) => alert(`delete: ${id}`),
  },
};
