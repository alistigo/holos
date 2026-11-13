import type { Meta, StoryObj } from "@storybook/react-vite";
import { DrawToolbar } from "./DrawToolbar.js";

const meta: Meta<typeof DrawToolbar> = {
  component: DrawToolbar,
  title: "AiDrawComments/DrawToolbar",
  args: { onToolChange: () => {} },
};

export default meta;

type Story = StoryObj<typeof DrawToolbar>;

export const RectangleSelected: Story = {
  args: { activeTool: "rectangle" },
};

export const LineSelected: Story = {
  args: { activeTool: "line" },
};
