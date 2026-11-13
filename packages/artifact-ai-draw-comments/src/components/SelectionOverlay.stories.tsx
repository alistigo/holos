import type { Meta, StoryObj } from "@storybook/react-vite";
import { SelectionOverlay } from "./SelectionOverlay.js";

const meta: Meta<typeof SelectionOverlay> = {
  component: SelectionOverlay,
  title: "AiDrawComments/SelectionOverlay",
  parameters: { layout: "fullscreen" },
  args: { onSelect: () => {}, onCancel: () => {} },
};

export default meta;

type Story = StoryObj<typeof SelectionOverlay>;

export const Default: Story = {};
