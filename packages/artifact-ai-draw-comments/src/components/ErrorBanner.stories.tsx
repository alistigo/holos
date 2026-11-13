import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorBanner } from "./ErrorBanner.js";

const meta: Meta<typeof ErrorBanner> = {
  component: ErrorBanner,
  title: "AiDrawComments/ErrorBanner",
  args: { onDismiss: () => {} },
};

export default meta;

type Story = StoryObj<typeof ErrorBanner>;

export const Default: Story = {
  args: { message: "Failed to send annotation. Check your connection and try again." },
};

export const ClaudeUnavailable: Story = {
  args: {
    message: "window.claude is not available. This widget requires a Claude artifact context.",
  },
};
