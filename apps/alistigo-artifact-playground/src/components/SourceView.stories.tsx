import type { Meta, StoryObj } from "@storybook/react-vite";
import { SourceView } from "./SourceView";

const SAMPLE_HTML = [
  "<!DOCTYPE html>",
  '<html lang="en">',
  "<head>",
  '  <meta charset="UTF-8" />',
  "  <title>example</title>",
  "  <style>body { font-family: sans-serif; padding: 1rem; }</style>",
  "</head>",
  "<body>",
  "  <h1>Hello world</h1>",
  '  <p class="intro">This is a <strong>sample</strong> HTML document.</p>',
  '  <script type="application/json" id="alistigo-config">{"app":"@alistigo/artifact-list","lang":"en","readonly":false}</script>',
  "</body>",
  "</html>",
].join("\n");

const BRIDGE_SNIPPET = [
  '<script src="/assets/html-to-image-D-nNcK7c.js"></script>',
  "<script>",
  "  window.claudeArtifactApi = { complete, storage, download };",
  "</script>",
  '<script>window.claudeArtifactStatus = "published";</script>',
].join("\n");

const ARTIFACT_SNIPPET =
  '<script type="module" src="http://localhost:5173/src/artifact-entry.tsx"></script>';

const meta: Meta<typeof SourceView> = {
  title: "Playground/SourceView",
  component: SourceView,
  parameters: { layout: "fullscreen" },
  tags: ["playground"],
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SourceView>;

/** The Source tab: the whole injected document. */
export const WholeDocument: Story = { args: { code: SAMPLE_HTML, label: "srcdoc HTML" } };

/** The AI Bridge tab: one segment, a few lines of it. */
export const BridgeSegment: Story = { args: { code: BRIDGE_SNIPPET, label: "AI bridge" } };

/** The Artifact source tab: the single tag that loads the artifact. */
export const ArtifactSegment: Story = {
  args: { code: ARTIFACT_SNIPPET, label: "artifact entry" },
};

/** An empty segment — what AI Bridge shows when the context injects no bridge. */
export const EmptySegmentWithMessage: Story = {
  args: {
    code: "",
    label: "AI bridge",
    emptyMessage: "This AI context injects no bridge code.",
  },
};

/** Empty with no message: the highlighter renders, blank. */
export const EmptyWithoutMessage: Story = { args: { code: "", label: "srcdoc HTML" } };

export const LongDocument: Story = {
  args: {
    label: "srcdoc HTML",
    code: Array.from({ length: 30 }, (_, i) => `<!-- line ${i} -->\n${SAMPLE_HTML}`).join("\n"),
  },
};
