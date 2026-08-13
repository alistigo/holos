import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FileUploadForm } from "./FileUploadForm.js";

const meta: Meta<typeof FileUploadForm> = {
  title: "Components/FileUploadForm",
  component: FileUploadForm,
  parameters: { layout: "padded" },
  args: {
    onUpload: fn(),
    onCancel: fn(),
    maxPerKeyMib: 5,
  },
};

export default meta;
type Story = StoryObj<typeof FileUploadForm>;

export const Default: Story = {};

export const TightLimit: Story = {
  args: { maxPerKeyMib: 1 },
  name: "Tight limit (1 MiB)",
};

export const StorageFull: Story = {
  args: { availableBytes: 0 },
  name: "Storage full",
};

export const AlmostFull: Story = {
  args: { availableBytes: 512 * 1024 },
  name: "Almost full (512 KiB left)",
};
