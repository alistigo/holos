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
    maxPerKeyMb: 5,
  },
};

export default meta;
type Story = StoryObj<typeof FileUploadForm>;

export const Default: Story = {};

export const SmallMaxLimit: Story = {
  args: { maxPerKeyMb: 1 },
  name: "Tight limit (1 MB)",
};
