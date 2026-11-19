import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { assembleSrcdoc, buildIframeParts, type SrcdocPart } from "../buildIframeSrcdoc";
import type { Config } from "../playground-config";
import { ArtifactViewPanel } from "./ArtifactViewPanel";

/**
 * Built through the real builder rather than hand-written markup, so the tabs
 * show a genuine partition of a genuine document — a hand-made srcdoc and a
 * hand-made parts list could disagree, and the panel would look right while
 * demonstrating nothing.
 */
const BASE_CONFIG: Config = {
  app: "@alistigo/artifact-list",
  lang: "en",
  aiContext: "claude",
  readonly: false,
  document: "groceries",
  rawMarkdown: "",
  plugins: {},
  published: true,
  mode: "dev",
};

const STORY_ASSETS = {
  bridgeHtml: [
    "<script>",
    "  // claude-artifact-api inject script (abridged for the story)",
    "  window.claudeArtifactApi = { complete, storage, download };",
    "</script>",
  ].join("\n    "),
  htmlToImageUrl: "/assets/html-to-image-D-nNcK7c.js",
};

const SAMPLE_AI_INPUT = "Groceries:\n- Buy bread\n- Buy milk";

function partsFor(config: Config, aiInput?: string): SrcdocPart[] {
  return buildIframeParts({
    config,
    ...(aiInput !== undefined ? { aiInputMarkdown: aiInput } : {}),
    scriptUrl: "http://localhost:5173/src/artifact-entry.tsx",
    csp: "default-src 'none'; script-src 'self' 'unsafe-inline'",
    isDev: true,
    devPluginUrlOverrides: { "@alistigo/artifact-list-checkbox-plugin": "/@fs/x/index.js" },
    assets: STORY_ASSETS,
  });
}

const CLAUDE_PARTS = partsFor(BASE_CONFIG, SAMPLE_AI_INPUT);
const NO_INPUT_PARTS = partsFor(BASE_CONFIG);
const NO_AI_PARTS = partsFor({ ...BASE_CONFIG, aiContext: "none" });

const SAMPLE_CONFIG_JSON = JSON.stringify(
  { app: "@alistigo/artifact-list", lang: "en", readonly: false },
  null,
  2,
);

const meta: Meta<typeof ArtifactViewPanel> = {
  title: "Playground/ArtifactViewPanel",
  component: ArtifactViewPanel,
  parameters: { layout: "fullscreen" },
  tags: ["playground"],
  decorators: [
    (Story) => (
      <div className="h-screen flex">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ArtifactViewPanel>;

function Panel({
  parts,
  aiInput,
}: {
  parts: readonly SrcdocPart[];
  aiInput: string | undefined;
}): React.JSX.Element {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  return (
    <ArtifactViewPanel
      srcdoc={assembleSrcdoc(parts)}
      parts={parts}
      iframeRef={iframeRef}
      reloadKey={0}
      iframeAllow="clipboard-write"
      configJson={SAMPLE_CONFIG_JSON}
      aiInput={aiInput}
    />
  );
}

/**
 * All seven tabs: App, Source, then the three new code views grouped with it,
 * then Config and AI Input. Click through to compare Source against the three
 * segments it is the whole of.
 */
export const ClaudeContext: Story = {
  render: () => <Panel parts={CLAUDE_PARTS} aiInput={SAMPLE_AI_INPUT} />,
};

/**
 * `aiContext: "none"` — the AI Bridge tab shows its empty-state message rather
 * than a blank panel or the previous context's code.
 */
export const NoAiContext: Story = {
  render: () => <Panel parts={NO_AI_PARTS} aiInput={undefined} />,
};

/** No AI input: the AI Input tab explains that the default empty list will boot. */
export const NoAiInput: Story = {
  render: () => <Panel parts={NO_INPUT_PARTS} aiInput={undefined} />,
};
