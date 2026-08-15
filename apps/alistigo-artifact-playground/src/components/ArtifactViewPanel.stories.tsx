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
  '  <script id="ai-input-action" type="text/markdown">Groceries:\n- Buy bread\n- Buy milk</script>',
  '  <script type="module" src="http://localhost:5173/src/artifact-entry.tsx"></script>',
  "</body>",
  "</html>",
].join("\n");

const SAMPLE_CONFIG_JSON = JSON.stringify(
  { app: "@alistigo/artifact-list", lang: "en", readonly: false },
  null,
  2,
);

const SAMPLE_AI_INPUT = "Groceries:\n- Buy bread\n- Buy milk";

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
        configJson={SAMPLE_CONFIG_JSON}
        aiInput={SAMPLE_AI_INPUT}
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
        configJson={SAMPLE_CONFIG_JSON}
        aiInput={SAMPLE_AI_INPUT}
      />
    );
  },
};

export const ConfigTabSelected: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <ArtifactViewPanel
        srcdoc={SAMPLE_SRCDOC}
        iframeRef={iframeRef}
        reloadKey={0}
        iframeAllow="clipboard-write"
        configJson={SAMPLE_CONFIG_JSON}
        aiInput={SAMPLE_AI_INPUT}
      />
    );
  },
};

export const AiInputTabSelected: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <ArtifactViewPanel
        srcdoc={SAMPLE_SRCDOC}
        iframeRef={iframeRef}
        reloadKey={0}
        iframeAllow="clipboard-write"
        configJson={SAMPLE_CONFIG_JSON}
        aiInput={SAMPLE_AI_INPUT}
      />
    );
  },
};

export const NoAiInput: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const iframeRef = useRef<HTMLIFrameElement>(null);
    return (
      <ArtifactViewPanel
        srcdoc={SAMPLE_SRCDOC}
        iframeRef={iframeRef}
        reloadKey={0}
        iframeAllow="clipboard-write"
        configJson={SAMPLE_CONFIG_JSON}
        aiInput={undefined}
      />
    );
  },
};
