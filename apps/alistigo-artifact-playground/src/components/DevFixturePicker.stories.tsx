import type { Meta, StoryObj } from "@storybook/react-vite";
import DevFixturePicker from "./DevFixturePicker";

const meta: Meta<typeof DevFixturePicker> = {
  title: "Dev/DevFixturePicker",
  component: DevFixturePicker,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof DevFixturePicker>;

export const Default: Story = {
  args: {
    onPick: (document) => console.log("Fixture picked:", document),
  },
};
