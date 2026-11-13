import type { Meta, StoryObj } from "@storybook/react-vite";
import { DrawCommentButton } from "./DrawCommentButton.js";

const meta: Meta<typeof DrawCommentButton> = {
  component: DrawCommentButton,
  title: "AiDrawComments/DrawCommentButton",
  args: { onClick: () => {} },
};

export default meta;

type Story = StoryObj<typeof DrawCommentButton>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledWithReason: Story = {
  args: { disabled: true, disabledReason: "An annotation is in progress" },
};
