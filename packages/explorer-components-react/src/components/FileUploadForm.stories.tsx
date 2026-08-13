import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { FileStorageFormat } from "./FileUploadForm.js";
import { FileUploadForm } from "./FileUploadForm.js";

const MIB = 1024 * 1024;

function estimateBase64Bytes(file: File): number {
  return Math.ceil(file.size / 3) * 4 + 200;
}
function estimateBinaryBytes(file: File): number {
  return file.size + 50;
}

// fallow-ignore-next-line complexity
function FileUploadFormDemo({
  availableBytes,
  maxPerKeyMib = 5,
}: {
  availableBytes?: number;
  maxPerKeyMib?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [storageFormat, setStorageFormat] = useState<FileStorageFormat>("base64");
  const maxPerKeyBytes = maxPerKeyMib * MIB;
  const estimatedBytes =
    file !== null
      ? storageFormat === "base64"
        ? estimateBase64Bytes(file)
        : estimateBinaryBytes(file)
      : 0;
  const isFull = availableBytes !== undefined && availableBytes <= 0;
  const isOverPerKey = file !== null && estimatedBytes >= maxPerKeyBytes;
  const isOverSpace =
    !isFull && file !== null && availableBytes !== undefined && estimatedBytes > availableBytes;
  return (
    <FileUploadForm
      file={file}
      onFileChange={setFile}
      storageFormat={storageFormat}
      onStorageFormatChange={setStorageFormat}
      availableBytes={availableBytes}
      maxPerKeyMib={maxPerKeyMib}
      estimatedBytes={estimatedBytes}
      isFull={isFull}
      isOverPerKey={isOverPerKey}
      isOverSpace={isOverSpace}
    />
  );
}

const meta: Meta<typeof FileUploadFormDemo> = {
  title: "Components/FileUploadForm",
  component: FileUploadFormDemo,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FileUploadFormDemo>;

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
