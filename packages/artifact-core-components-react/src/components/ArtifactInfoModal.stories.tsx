import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactInfoModal } from "./ArtifactInfoModal.js";

const meta: Meta<typeof ArtifactInfoModal> = {
  component: ArtifactInfoModal,
  title: "Platform/ArtifactInfoModal",
  parameters: { layout: "fullscreen" },
  args: { onClose: () => {} },
};

export default meta;

type Story = StoryObj<typeof ArtifactInfoModal>;

export const AllLoaded: Story = {
  args: {
    artifactName: "@alistigo/artifact-list",
    artifactVersion: "1.0.0",
    plugins: [
      {
        name: "@alistigo/artifact-sentry-plugin",
        version: "0.1.0",
        type: "infra",
        status: "loaded",
      },
      {
        name: "@alistigo/artifact-posthog-plugin",
        version: "0.1.0",
        type: "infra",
        status: "loaded",
      },
      {
        name: "@alistigo/claude-storage-plugin",
        version: "0.1.0",
        type: "storage",
        status: "loaded",
      },
    ],
  },
};

export const OneErrored: Story = {
  args: {
    artifactName: "@alistigo/artifact-list",
    artifactVersion: "1.0.0",
    plugins: [
      {
        name: "@alistigo/artifact-sentry-plugin",
        version: "0.1.0",
        type: "infra",
        status: "loaded",
      },
      {
        name: "@alistigo/artifact-posthog-plugin",
        version: "0.1.0",
        type: "infra",
        status: "error",
        error: "Network timeout during script load",
      },
    ],
  },
};

export const NoPlugins: Story = {
  args: {
    artifactName: "@alistigo/artifact-list",
    artifactVersion: "0.1.0",
    plugins: [],
  },
};
