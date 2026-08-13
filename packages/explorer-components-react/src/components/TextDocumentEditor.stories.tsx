import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { TextDocumentFormat } from "./TextDocumentEditor.js";
import { TextDocumentEditor } from "./TextDocumentEditor.js";

const meta: Meta<typeof TextDocumentEditor> = {
  title: "Explorer/TextDocumentEditor",
  component: TextDocumentEditor,
  decorators: [
    (Story) => (
      <div className="h-72 w-[28rem] border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TextDocumentEditor>;

// ── Controlled wrappers for interactive stories ───────────────────────────────

function ControlledEditor(
  props: Omit<React.ComponentProps<typeof TextDocumentEditor>, "text" | "onTextChange">,
): React.JSX.Element {
  const [text, setText] = useState(props.format === "json" ? '{\n  "hello": "world"\n}' : "");
  return <TextDocumentEditor {...props} text={text} onTextChange={setText} />;
}

function ControlledCreateMode({
  initialFormat = "json",
}: {
  initialFormat?: TextDocumentFormat;
}): React.JSX.Element {
  const [text, setText] = useState(initialFormat === "json" ? '{\n  "hello": "world"\n}' : "");
  const [format, setFormat] = useState<TextDocumentFormat>(initialFormat);

  const handleFormatChange = (f: TextDocumentFormat) => {
    setFormat(f);
    setText(f === "json" ? "{}" : "");
  };
  const handleFormat = () => {
    if (format === "json") {
      try {
        setText(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        /* leave as-is */
      }
    } else if (format === "plain") {
      setText(text.trim());
    }
  };

  return (
    <TextDocumentEditor
      text={text}
      onTextChange={setText}
      format={format}
      onFormatChange={handleFormatChange}
      onFormat={handleFormat}
    />
  );
}

// ── Create mode stories ───────────────────────────────────────────────────────

export const CreateModeJson: Story = {
  name: "Create — JSON",
  render: () => <ControlledCreateMode initialFormat="json" />,
};

export const CreateModePlain: Story = {
  name: "Create — Plain text",
  render: () => <ControlledCreateMode initialFormat="plain" />,
};

export const CreateModeYaml: Story = {
  name: "Create — YAML",
  render: () => <ControlledCreateMode initialFormat="yaml" />,
};

export const CreateModeJsonError: Story = {
  name: "Create — JSON parse error",
  render: () => (
    <ControlledEditor
      format="json"
      onFormatChange={() => {}}
      onFormat={() => {}}
      error="Expected ',' or '}' after property value in JSON at position 18"
    />
  ),
  args: { text: '{ "name": "Alice" oops }', format: "json" },
};

export const CreateModeOverLimit: Story = {
  name: "Create — over per-key limit",
  render: () => (
    <ControlledEditor
      format="plain"
      onFormatChange={() => {}}
      onFormat={() => {}}
      overLimitMessage="Content too large — 5.01 MiB exceeds the 5.00 MiB per-key limit."
    />
  ),
  args: { text: "lots of text…", format: "plain" },
};

export const CreateModeOverSpace: Story = {
  name: "Create — not enough space",
  render: () => (
    <ControlledEditor
      format="plain"
      onFormatChange={() => {}}
      onFormat={() => {}}
      overSpaceMessage="Not enough space — 2.00 MiB needed, 0.50 MiB available."
    />
  ),
  args: { text: "some text", format: "plain" },
};

// ── Edit mode stories (no onFormatChange → format is fixed) ─────────────────

export const EditModeJsonSaved: Story = {
  name: "Edit — JSON saved",
  render: () => <ControlledEditor format="json" saveStatus="saved" />,
  args: { text: '{\n  "items": []\n}', format: "json" },
};

export const EditModeJsonDraft: Story = {
  name: "Edit — JSON unsaved (draft)",
  render: () => <ControlledEditor format="json" saveStatus="draft" />,
  args: { text: '{\n  "items": [1, 2]\n}', format: "json" },
};

export const EditModeJsonSaving: Story = {
  name: "Edit — JSON saving",
  render: () => <ControlledEditor format="json" saveStatus="saving" />,
  args: { text: '{\n  "items": [1, 2]\n}', format: "json" },
};

export const EditModeJsonInvalid: Story = {
  name: "Edit — JSON invalid (autosave blocked)",
  render: () => (
    <ControlledEditor format="json" saveStatus="draft" error="Invalid JSON — fix to auto-save" />
  ),
  args: { text: "{ bad json }", format: "json" },
};

export const EditModePlain: Story = {
  name: "Edit — Plain text",
  render: () => <ControlledEditor format="plain" saveStatus="saved" />,
  args: { text: "A plain text document stored verbatim.", format: "plain" },
};

export const EditModeYaml: Story = {
  name: "Edit — YAML",
  render: () => <ControlledEditor format="yaml" saveStatus="saved" />,
  args: { text: "name: Alice\nage: 30\nitems:\n  - milk\n  - eggs", format: "yaml" },
};
