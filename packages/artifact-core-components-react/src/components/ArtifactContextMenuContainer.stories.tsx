import type { Meta, StoryObj } from "@storybook/react-vite";
import logoUrl from "../assets/logo.png";
import { ArtifactContextMenuContainer } from "./ArtifactContextMenuContainer.js";

const meta: Meta<typeof ArtifactContextMenuContainer> = {
  component: ArtifactContextMenuContainer,
  title: "Platform/ArtifactContextMenuContainer",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative h-[400px] w-[600px] bg-gray-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ArtifactContextMenuContainer>;

export const Default: Story = {
  args: {
    icon: <img src={logoUrl} alt="" className="h-full w-full object-cover" />,
    title: "@alistigo/artifact-list",
    children: <p className="text-sm text-gray-600">Modal content goes here.</p>,
  },
};
