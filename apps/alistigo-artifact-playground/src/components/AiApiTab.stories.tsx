import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";
import { AiApiTab } from "./AiApiTab";

const meta: Meta<typeof AiApiTab> = {
  title: "Components/AiApiTab",
  component: AiApiTab,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof AiApiTab>;

export const NoOperations: Story = {
  render: () => {
    // biome-ignore lint: stable render fn in storybook
    const ref = useRef<HTMLIFrameElement | null>(null);
    return (
      <div style={{ height: 400, display: "flex" }}>
        <AiApiTab
          iframeRef={ref}
          apiDefinition={{
            info: { title: "Demo API", version: "1.0.0" },
            operations: {},
          }}
        />
      </div>
    );
  },
};

export const WithOperations: Story = {
  render: () => {
    // biome-ignore lint: stable render fn in storybook
    const ref = useRef<HTMLIFrameElement | null>(null);
    return (
      <div style={{ height: 400, display: "flex" }}>
        <AiApiTab
          iframeRef={ref}
          apiDefinition={{
            info: { title: "Demo API", version: "1.0.0" },
            operations: {
              greet: {
                description: "Send a greeting",
                params: {
                  type: "object",
                  properties: { name: { type: "string", description: "Name to greet" } },
                  required: ["name"],
                },
              },
            },
          }}
        />
      </div>
    );
  },
};
