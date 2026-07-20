import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { ArtifactViewPanel } from "./ArtifactViewPanel";

const SAMPLE_SRCDOC = [
  "<!DOCTYPE html>",
  '<html lang="en">',
  "<head>",
  '  <meta charset="UTF-8" />',
  "  <title>@alistigo/artifact-list</title>",
  '  <script type="application/json" id="alistigo-config">{"app":"@alistigo/artifact-list","lang":"en","readonly":false}</script>',
  "</head>",
  '<body id="artifacts-component-root-html">',
  '  <script type="application/json" id="alistigo-document">{"@type":"ItemList"}</script>',
  '  <script type="module" src="http://localhost:5173/src/artifact-entry.tsx"></script>',
  "</body>",
  "</html>",
].join("\n");

const meta: Meta<typeof ArtifactViewPanel> = {
  title: "Playground/ArtifactViewPanel",
  component: ArtifactViewPanel,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ArtifactViewPanel>;

export const SourceTabSelected: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <ArtifactViewPanel
        srcdoc={SAMPLE_SRCDOC}
        iframeRef={iframeRef}
        reloadKey={0}
        iframeAllow="clipboard-write"
      />
    );
  },
};

export const AppTabSelected: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <ArtifactViewPanel
        srcdoc={SAMPLE_SRCDOC}
        iframeRef={iframeRef}
        reloadKey={0}
        iframeAllow="clipboard-write"
      />
    );
  },
};
