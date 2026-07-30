import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlistigoBadge } from "./AlistigoBadge.js";
import { ArtifactInfoPanel } from "./ArtifactInfoPanel.js";

const meta: Meta<typeof AlistigoBadge> = {
  component: AlistigoBadge,
  title: "Platform/AlistigoBadge",
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

type Story = StoryObj<typeof AlistigoBadge>;

export const Collapsed: Story = {
  args: {
    children: (
      <ArtifactInfoPanel
        artifactName="@alistigo/artifact-list"
        artifactVersion="1.0.0"
        plugins={[
          {
            name: "@alistigo/artifact-sentry-plugin",
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
        ]}
      />
    ),
  },
};

export const WithErroredPlugin: Story = {
  args: {
    children: (
      <ArtifactInfoPanel
        artifactName="@alistigo/artifact-list"
        artifactVersion="1.0.0"
        plugins={[
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
            error: "Script load failed",
          },
        ]}
      />
    ),
  },
};
