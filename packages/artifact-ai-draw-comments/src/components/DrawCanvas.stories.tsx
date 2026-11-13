import type { Meta, StoryObj } from "@storybook/react-vite";
import type Konva from "konva";
import { useRef } from "react";
import { DrawCanvas } from "./DrawCanvas.js";

const meta: Meta<typeof DrawCanvas> = {
  component: DrawCanvas,
  title: "AiDrawComments/DrawCanvas",
  decorators: [
    (Story) => (
      <div style={{ position: "relative", width: 400, height: 300, background: "#f0f0f0" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof DrawCanvas>;

function CanvasWrapper(props: Omit<React.ComponentProps<typeof DrawCanvas>, "stageRef">) {
  const ref = useRef<Konva.Stage | null>(null);
  return <DrawCanvas {...props} stageRef={ref} />;
}

export const Empty: Story = {
  render: () => (
    <CanvasWrapper
      region={{ x: 0, y: 0, width: 400, height: 300 }}
      activeTool="rectangle"
      onShapesChange={() => {}}
    />
  ),
};

export const WithShapes: Story = {
  render: () => (
    <CanvasWrapper
      region={{ x: 0, y: 0, width: 400, height: 300 }}
      activeTool="line"
      onShapesChange={() => {}}
    />
  ),
};
