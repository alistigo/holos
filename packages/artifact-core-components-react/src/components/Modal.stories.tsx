import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal } from "./Modal.js";

const meta: Meta<typeof Modal> = {
  component: Modal,
  title: "Platform/Modal",
  parameters: { layout: "fullscreen" },
  args: { onClose: () => {} },
};

export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    title: "Modal title",
    children: <p className="text-sm text-gray-600">Modal content goes here.</p>,
  },
};

export const WithFooter: Story = {
  args: {
    title: "Confirm action",
    children: <p className="text-sm text-gray-600">Are you sure you want to proceed?</p>,
    footer: (
      <>
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
        >
          Confirm
        </button>
      </>
    ),
  },
};
