import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorScreen } from "./ErrorScreen.js";

const meta: Meta<typeof ErrorScreen> = {
  component: ErrorScreen,
  title: "Platform/ErrorScreen",
};

export default meta;

type Story = StoryObj<typeof ErrorScreen>;

export const WithReset: Story = {
  args: {
    error: new Error("Failed to initialize plugin: network timeout"),
    onReset: () => {
      window.location.reload();
    },
  },
};

export const WithoutReset: Story = {
  args: {
    error: new Error("Storage unavailable in this context"),
  },
};
