import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer.js";

const meta: Meta<typeof DocumentViewer> = {
  title: "Explorer/DocumentViewer",
  component: DocumentViewer,
  decorators: [
    (Story) => (
      <div className="h-80 w-96 border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocumentViewer>;

const SAMPLE_OBJECT = {
  id: "list:abc123",
  items: [
    { id: "item:1", text: "Buy milk", done: false },
    { id: "item:2", text: "Walk the dog", done: true },
  ],
  createdAt: "2026-07-30T10:00:00Z",
  metadata: { version: 2, locale: "en" },
};

const SAMPLE_JSON = JSON.stringify(SAMPLE_OBJECT, null, 2);

// ── Read-only stories ─────────────────────────────────────────────────────────

export const WithObject: Story = {
  args: { value: SAMPLE_OBJECT, isLoading: false },
};

export const WithString: Story = {
  args: { value: "plain string value stored in this key", isLoading: false },
};

export const WithJsonString: Story = {
  name: "With JSON string (auto-colorized)",
  args: { value: SAMPLE_JSON, isLoading: false },
};

export const WithNumber: Story = {
  args: { value: 42, isLoading: false },
};

export const Loading: Story = {
  args: { value: undefined, isLoading: true },
};

export const Empty: Story = {
  name: "Empty (no key selected)",
  args: { value: undefined, isLoading: false },
};

// ── Edit mode stories ─────────────────────────────────────────────────────────

function EditableViewer(
  props: Omit<React.ComponentProps<typeof DocumentViewer>, "editText" | "onEditTextChange">,
): React.JSX.Element {
  const [text, setText] = useState(SAMPLE_JSON);
  return <DocumentViewer {...props} editText={text} onEditTextChange={setText} />;
}

export const EditingJson: Story = {
  name: "Editing — JSON (saved)",
  render: (args) => <EditableViewer {...args} />,
  args: { value: SAMPLE_OBJECT, isLoading: false, saveStatus: "saved" },
};

export const EditingDraft: Story = {
  name: "Editing — JSON (unsaved)",
  render: (args) => <EditableViewer {...args} />,
  args: { value: SAMPLE_OBJECT, isLoading: false, saveStatus: "draft" },
};

export const EditingSaving: Story = {
  name: "Editing — JSON (saving)",
  render: (args) => <EditableViewer {...args} />,
  args: { value: SAMPLE_OBJECT, isLoading: false, saveStatus: "saving" },
};

export const EditingInvalidJson: Story = {
  name: "Editing — invalid JSON",
  render: (args) => {
    const [text, setText] = useState('{ "name": "Alice" oops }');
    return (
      <DocumentViewer
        {...args}
        editText={text}
        onEditTextChange={setText}
        isInvalidJson={true}
        saveStatus="draft"
      />
    );
  },
  args: { value: SAMPLE_OBJECT, isLoading: false },
};
