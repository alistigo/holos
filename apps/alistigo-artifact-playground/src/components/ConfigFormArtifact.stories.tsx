import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfigFormArtifact } from "./ConfigFormArtifact";

const meta: Meta<typeof ConfigFormArtifact> = {
  title: "Playground/ConfigFormArtifact",
  component: ConfigFormArtifact,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ConfigFormArtifact>;

export const Default: Story = {
  args: {
    lang: "en",
    readonly: false,
    onLangChange: () => {},
    onReadonlyChange: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    lang: "fr",
    readonly: true,
    onLangChange: () => {},
    onReadonlyChange: () => {},
  },
};
