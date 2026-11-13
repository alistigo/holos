import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentInput } from "./CommentInput.js";

const meta: Meta<typeof CommentInput> = {
  component: CommentInput,
  title: "AiDrawComments/CommentInput",
  args: { onCommentChange: () => {}, onSend: () => {} },
};

export default meta;

type Story = StoryObj<typeof CommentInput>;

export const EmptyDisabled: Story = {
  args: { comment: "", shapes: [] },
};

export const WithCommentEnabled: Story = {
  args: { comment: "This area has a bug", shapes: [] },
};

export const WithShapesEnabled: Story = {
  args: {
    comment: "",
    shapes: [
      {
        id: "1",
        type: "rectangle",
        startX: 10,
        startY: 10,
        endX: 100,
        endY: 50,
        strokeColor: "#ef4444",
      },
    ],
  },
};

export const Sending: Story = {
  args: {
    comment: "Sending…",
    shapes: [
      {
        id: "1",
        type: "rectangle",
        startX: 10,
        startY: 10,
        endX: 100,
        endY: 50,
        strokeColor: "#ef4444",
      },
    ],
    isSending: true,
  },
};
