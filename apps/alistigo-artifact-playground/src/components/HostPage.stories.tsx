import type { Meta, StoryObj } from "@storybook/react-vite";
import HostPage from "./HostPage";

const meta: Meta<typeof HostPage> = {
  title: "Dev/HostPage",
  component: HostPage,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof HostPage>;

export const Default: Story = {};
