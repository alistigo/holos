import type { Meta, StoryObj } from "@storybook/react-vite";
import logoUrl from "../assets/logo.png";
import { ArtifactContextMenuContainer } from "./ArtifactContextMenuContainer.js";

const meta: Meta<typeof ArtifactContextMenuContainer> = {
  component: ArtifactContextMenuContainer,
  title: "Platform/ArtifactContextMenuContainer",
};

export default meta;

type Story = StoryObj<typeof ArtifactContextMenuContainer>;

export const Content: Story = {
  args: {
    icon: <img src={logoUrl} alt="" className="h-5 w-5 object-contain" />,
    children: <p>Content</p>,
  },
};
