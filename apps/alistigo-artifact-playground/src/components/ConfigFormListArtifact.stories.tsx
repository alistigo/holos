import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfigFormListArtifact } from "./ConfigFormListArtifact";

const meta: Meta<typeof ConfigFormListArtifact> = {
  title: "Playground/ConfigFormListArtifact",
  component: ConfigFormListArtifact,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ConfigFormListArtifact>;

export const Default: Story = {
  args: {
    app: "@alistigo/artifact-list",
    plugins: {},
    document: "",
    rawMarkdown: "",
    documentNames: ["duplicates", "empty", "groceries"],
    onPluginsChange: () => {},
    onDocumentChange: () => {},
  },
};

export const WithPluginsEnabled: Story = {
  args: {
    app: "@alistigo/artifact-list",
    plugins: {
      "@alistigo/artifact-sentry-plugin": {},
      "@alistigo/artifact-posthog-plugin": { apiKey: "phc_test123" },
    },
    document: "groceries",
    rawMarkdown: "",
    documentNames: ["duplicates", "empty", "groceries"],
    onPluginsChange: () => {},
    onDocumentChange: () => {},
  },
};

export const RawMarkdownMode: Story = {
  args: {
    app: "@alistigo/artifact-list",
    plugins: {},
    document: "__raw__",
    rawMarkdown: "My list:\n- Item one\n- Item two",
    documentNames: ["duplicates", "empty", "groceries"],
    onPluginsChange: () => {},
    onDocumentChange: () => {},
  },
};
