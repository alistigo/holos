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

const meta: Meta<typeof SourceView> = {
  title: "Playground/SourceView",
  component: SourceView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SourceView>;

export const Default: Story = { args: { html: SAMPLE_HTML } };
export const Empty: Story = { args: { html: "" } };
export const LongHtml: Story = {
  args: {
    html: Array.from({ length: 30 }, (_, i) => `<!-- line ${i} -->\n${SAMPLE_HTML}`).join("\n"),
  },
};
