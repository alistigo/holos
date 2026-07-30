import type { Meta, StoryObj } from "@storybook/react-vite";
import { JsonDocumentViewer } from "./JsonDocumentViewer.js";

const meta: Meta<typeof JsonDocumentViewer> = {
  title: "Explorer/JsonDocumentViewer",
  component: JsonDocumentViewer,
  decorators: [
    (Story) => (
      <div className="h-80 w-96 border border-gray-200 rounded overflow-hidden flex flex-col">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JsonDocumentViewer>;

const SAMPLE_OBJECT = {
  id: "list:abc123",
  items: [
    { id: "item:1", text: "Buy milk", done: false },
    { id: "item:2", text: "Walk the dog", done: true },
  ],
  createdAt: "2026-07-30T10:00:00Z",
  metadata: { version: 2, locale: "en" },
};

export const WithObject: Story = {
  args: {
    value: SAMPLE_OBJECT,
    isLoading: false,
    onDelete: () => alert("delete clicked"),
    isDeleting: false,
  },
};

export const WithString: Story = {
  args: {
    value: "plain string value stored in this key",
    isLoading: false,
    onDelete: () => alert("delete clicked"),
    isDeleting: false,
  },
};

export const WithNumber: Story = {
  args: {
    value: 42,
    isLoading: false,
    onDelete: () => alert("delete clicked"),
    isDeleting: false,
  },
};

export const Loading: Story = {
  args: {
    value: undefined,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    value: undefined,
    isLoading: false,
  },
};

export const Deleting: Story = {
  args: {
    value: SAMPLE_OBJECT,
    isLoading: false,
    onDelete: () => {},
    isDeleting: true,
  },
};

export const WithoutDeleteButton: Story = {
  args: {
    value: SAMPLE_OBJECT,
    isLoading: false,
  },
};
