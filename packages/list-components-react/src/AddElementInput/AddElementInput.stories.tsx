import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { AddElementInput } from "./AddElementInput.js";

const meta: Meta<typeof AddElementInput> = {
  title: "Alistigo/AddElementInput",
  component: AddElementInput,
  args: {
    onAdd: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof AddElementInput>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
