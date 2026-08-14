import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { KeyContentViewer } from "./KeyContentViewer.js";

const meta: Meta<typeof KeyContentViewer> = {
  title: "Explorer/KeyContentViewer",
  component: KeyContentViewer,
  decorators: [
    (Story) => (
      <div className="h-96 w-[30rem] border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KeyContentViewer>;

// 1×1 transparent PNG (data URI)
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

// ── Stateless / no-entry state ────────────────────────────────────────────────

export const NoSelection: Story = {
  name: "No entry selected",
  args: { entry: undefined, isLoading: false },
};

export const Loading: Story = {
  args: { entry: undefined, isLoading: true },
};

// ── JSON document entry ───────────────────────────────────────────────────────

function EditableJsonViewer(
  props: Omit<
    React.ComponentProps<typeof KeyContentViewer>,
    "editText" | "onEditTextChange" | "entry"
  >,
): React.JSX.Element {
  const [text, setText] = useState(SAMPLE_JSON);
  const entry = { key: "alistigo:list:abc123", shared: false, value: SAMPLE_OBJECT };
  return <KeyContentViewer {...props} entry={entry} editText={text} onEditTextChange={setText} />;
}

export const JsonEntry: Story = {
  name: "JSON entry — View tab",
  render: (args) => <EditableJsonViewer {...args} />,
  args: { isLoading: false, saveStatus: "saved" },
};

export const JsonEntryDraft: Story = {
  name: "JSON entry — unsaved",
  render: (args) => <EditableJsonViewer {...args} />,
  args: { isLoading: false, saveStatus: "draft" },
};

export const JsonEntryInvalid: Story = {
  name: "JSON entry — invalid JSON",
  render: (args) => {
    const [text, setText] = useState('{ "name": "Alice" oops }');
    const entry = { key: "alistigo:list:abc123", shared: false, value: SAMPLE_OBJECT };
    return (
      <KeyContentViewer
        {...args}
        entry={entry}
        editText={text}
        onEditTextChange={setText}
        isInvalidJson={true}
        saveStatus="draft"
      />
    );
  },
  args: { isLoading: false },
};

// ── File entry ────────────────────────────────────────────────────────────────

export const FileEntryImage: Story = {
  name: "File entry — PNG image",
  args: {
    entry: {
      key: "avatar.png",
      shared: false,
      value: {
        _type: "file",
        name: "avatar.png",
        mimeType: "image/png",
        size: 68,
        uploadedAt: "2026-08-13T10:00:00.000Z",
        data: PNG_1X1,
      },
    },
    isLoading: false,
  },
};

export const FileEntryPdf: Story = {
  name: "File entry — PDF",
  args: {
    entry: {
      key: "report.pdf",
      shared: false,
      value: {
        _type: "file",
        name: "report.pdf",
        mimeType: "application/pdf",
        size: 204800,
        uploadedAt: "2026-08-13T10:00:00.000Z",
        data: "data:application/pdf;base64,JVBERi0xLjQ=",
      },
    },
    isLoading: false,
  },
};

// ── Text document entry (YAML) ────────────────────────────────────────────────

function EditableYamlViewer(
  props: Omit<
    React.ComponentProps<typeof KeyContentViewer>,
    "editText" | "onEditTextChange" | "entry" | "format"
  >,
): React.JSX.Element {
  const [text, setText] = useState("name: Alice\nage: 30\nitems:\n  - milk\n  - eggs");
  const entry = {
    key: "prefs:user",
    shared: true,
    value: {
      _type: "document",
      format: "yaml" as const,
      content: text,
      createdAt: "2026-08-14T10:00:00Z",
    },
  };
  return (
    <KeyContentViewer
      {...props}
      entry={entry}
      format="yaml"
      editText={text}
      onEditTextChange={setText}
    />
  );
}

export const YamlEntry: Story = {
  name: "YAML document entry",
  render: (args) => <EditableYamlViewer {...args} />,
  args: { isLoading: false, saveStatus: "saved" },
};

// ── Raw tab ───────────────────────────────────────────────────────────────────

export const RawTabShared: Story = {
  name: "Raw tab — shared JSON entry",
  args: {
    entry: {
      key: "alistigo:prefs:user",
      shared: true,
      value: SAMPLE_OBJECT,
    },
    isLoading: false,
    editText: SAMPLE_JSON,
    onEditTextChange: () => {},
    saveStatus: "saved",
  },
};
