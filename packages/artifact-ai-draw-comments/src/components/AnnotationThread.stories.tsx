import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DrawCommentSession } from "../domain/session.js";
import { AnnotationThread } from "./AnnotationThread.js";

const meta: Meta<typeof AnnotationThread> = {
  component: AnnotationThread,
  title: "AiDrawComments/AnnotationThread",
};

export default meta;

type Story = StoryObj<typeof AnnotationThread>;

const baseSession: DrawCommentSession = {
  id: "s1",
  status: "sent",
  region: { x: 0, y: 0, width: 300, height: 200 },
  shapes: [],
  comment: "What does this button do?",
  snapshot: {
    pngBase64:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    comment: "What does this button do?",
    capturedAt: Date.now(),
  },
  claudeResponse: null,
  error: null,
};

export const Loading: Story = {
  args: { session: baseSession },
};

export const WithResponse: Story = {
  args: {
    session: {
      ...baseSession,
      status: "responded",
      claudeResponse:
        "That button submits the form. It will validate all fields before sending the data to the server.",
    },
  },
};
