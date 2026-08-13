import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "@storybook/test";
import { NewEntryPanel } from "./NewEntryPanel.js";

async function openTextTab(canvasElement: HTMLElement): Promise<ReturnType<typeof within>> {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: /text document/i }));
  return canvas;
}

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

// ── File tab (default) ────────────────────────────────────────────────────────

export const FileTab: Story = {
  name: "File tab (default)",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
};

export const StorageFull: Story = {
  name: "File tab — storage full",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
    availableBytes: 0,
  },
};

export const AlmostFull: Story = {
  name: "File tab — almost full (512 KiB left)",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
    availableBytes: 512 * 1024,
  },
};

// ── Text document tab ─────────────────────────────────────────────────────────

export const TextTabJson: Story = {
  name: "Text tab — JSON",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async (key, text) => {
      alert(`create: ${key}\n${text}`);
    },
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    await openTextTab(canvasElement);
  },
};

export const TextTabPlain: Story = {
  name: "Text tab — Plain text",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = await openTextTab(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "plain");
    await userEvent.type(canvas.getByPlaceholderText(/my-document/i), "readme");
  },
};

export const TextTabYaml: Story = {
  name: "Text tab — YAML",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = await openTextTab(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox"), "yaml");
    await userEvent.type(canvas.getByPlaceholderText(/my-document/i), "config");
  },
};

export const TextTabKeyExists: Story = {
  name: "Text tab — key already exists",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = await openTextTab(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText(/my-document/i), "my-doc");
  },
};

export const TextTabStorageFull: Story = {
  name: "Text tab — storage full",
  args: {
    existingEntries: EXISTING,
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
    availableBytes: 0,
  },
  play: async ({ canvasElement }) => {
    await openTextTab(canvasElement);
  },
};

export const NoExistingKeys: Story = {
  name: "Empty storage — no existing keys",
  args: {
    existingEntries: [],
    onUpload: async () => {},
    onCreateText: async () => {},
    onCancel: () => {},
  },
};
