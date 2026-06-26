import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState.js";

const meta: Meta<typeof EmptyState> = {
  title: "Alistigo/EmptyState",
  component: EmptyState,
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const CustomMessage: Story = {
  args: {
    message: "Add your first element to get started.",
  },
};
