import type { Meta, StoryObj } from "@storybook/react";
import { FileViewer } from "./FileViewer.js";

const meta: Meta<typeof FileViewer> = {
  title: "Components/FileViewer",
  component: FileViewer,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FileViewer>;

// 1×1 transparent PNG (data URI)
const PNG_1X1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const ImagePng: Story = {
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
  },
};

export const PdfFile: Story = {
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
  },
};

export const TextFile: Story = {
  args: {
    entry: {
      key: "readme.txt",
      shared: false,
      value: {
        _type: "file",
        name: "readme.txt",
        mimeType: "text/plain",
        size: 42,
        uploadedAt: "2026-08-13T10:00:00.000Z",
        data: "data:text/plain;base64,SGVsbG8gV29ybGQ=",
      },
    },
  },
};

export const SharedEntry: Story = {
  args: {
    entry: {
      key: "banner.png",
      shared: true,
      value: {
        _type: "file",
        name: "banner.png",
        mimeType: "image/png",
        size: 68,
        uploadedAt: "2026-08-01T08:30:00.000Z",
        data: PNG_1X1,
      },
    },
  },
};
