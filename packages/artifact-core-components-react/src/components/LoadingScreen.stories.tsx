import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingScreen } from "./LoadingScreen.js";

const meta: Meta<typeof LoadingScreen> = {
  component: LoadingScreen,
  title: "Platform/LoadingScreen",
};

export default meta;

type Story = StoryObj<typeof LoadingScreen>;

export const Default: Story = {};

export const WithArtifactName: Story = {
  args: { artifactName: "@alistigo/artifact-list" },
};
