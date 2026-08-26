import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckboxLeading } from "./CheckboxLeading.js";

const meta: Meta<typeof CheckboxLeading> = {
  title: "artifact-list-checkbox-plugin/CheckboxLeading",
  component: CheckboxLeading,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof CheckboxLeading>;

const noopCommand = () => {};

export const Unchecked: Story = {
  args: {
    elementId: "elem_01",
    metadata: { selected: false },
    onCommand: noopCommand,
  },
};

export const Checked: Story = {
  args: {
    elementId: "elem_01",
    metadata: { selected: true },
    onCommand: noopCommand,
  },
};

export const NoMetadata: Story = {
  args: {
    elementId: "elem_01",
    metadata: {},
    onCommand: noopCommand,
  },
};
