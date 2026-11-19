import type { Meta, StoryObj } from "@storybook/react-vite";
import { PLAYGROUND_STATE_KEY } from "../playground-state";
import HostPage from "./HostPage";

/**
 * Clears the playground's saved setup before each story.
 *
 * HostPage persists its form configuration to localStorage, and Storybook runs
 * every story on one origin: without this, a story inherits whatever the last
 * one left behind and the panel is no longer being reviewed in a known state.
 * It also stops a Storybook session from leaving a setup behind for the real
 * playground, which shares the key.
 */
function clearSavedSetup(): void {
  try {
    localStorage.removeItem(PLAYGROUND_STATE_KEY);
  } catch {
    /* storage unavailable — stories render on defaults anyway */
  }
}

const meta: Meta<typeof HostPage> = {
  title: "Dev/HostPage",
  component: HostPage,
  parameters: { layout: "fullscreen" },
  tags: ["playground"],
  beforeEach: () => {
    clearSavedSetup();
    return () => clearSavedSetup();
  },
};

export default meta;
type Story = StoryObj<typeof HostPage>;

export const Default: Story = {};
