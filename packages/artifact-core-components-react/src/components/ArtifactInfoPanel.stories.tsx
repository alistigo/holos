import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArtifactInfoPanel } from "./ArtifactInfoPanel.js";

const meta: Meta<typeof ArtifactInfoPanel> = {
  component: ArtifactInfoPanel,
  title: "Platform/ArtifactInfoPanel",
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof ArtifactInfoPanel>;

export const AllActive: Story = {
  args: {
    artifactName: "@alistigo/artifact-list",
    artifactVersion: "1.0.0",
    plugins: [
      {
        name: "@alistigo/artifact-sentry-plugin",
        version: "0.1.0",
        type: "infra",
        status: "active",
      },
      {
        name: "@alistigo/artifact-posthog-plugin",
        version: "0.1.0",
        type: "infra",
        status: "active",
      },
      {
        name: "@alistigo/claude-storage-plugin",
        version: "0.1.0",
        type: "storage",
        status: "active",
      },
      {
        name: "@alistigo/local-storage-plugin",
        version: "0.1.0",
        type: "storage",
        status: "inactive",
      },
    ],
  },
};

export const OneLoading: Story = {
  args: {
    artifactName: "@alistigo/artifact-list",
    artifactVersion: "1.0.0",
    plugins: [
      {
        name: "@alistigo/artifact-sentry-plugin",
        version: "0.1.0",
        type: "infra",
        status: "active",
      },
      {
        name: "@alistigo/claude-storage-plugin",
        version: "0.1.0",
        type: "storage",
        status: "loading",
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
        status: "active",
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
