import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlistigoBadge } from "./AlistigoBadge.js";

const meta: Meta<typeof AlistigoBadge> = {
  component: AlistigoBadge,
  title: "Platform/AlistigoBadge",
};

export default meta;

type Story = StoryObj<typeof AlistigoBadge>;

export const Content: Story = {
  args: {
    children: <p>Content</p>,
  },
};
