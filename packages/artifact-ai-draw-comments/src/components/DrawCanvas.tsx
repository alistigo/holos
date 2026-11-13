import type Konva from "konva";
// Explicit shape registration for react-konva core mode (tree-shaking: avoids full konva import)
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Rect";
import { useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import type { SelectionRegion } from "../domain/session.js";
import { DEFAULT_STROKE_COLOR, type DrawShape } from "../domain/shapes.js";

interface DrawCanvasProps {
  region: SelectionRegion;
  activeTool: "rectangle" | "line";
  onShapesChange: (shapes: DrawShape[]) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

interface DraftShape {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function DrawCanvas({ region, activeTool, onShapesChange, stageRef }: DrawCanvasProps) {
  const [shapes, setShapes] = useState<DrawShape[]>([]);
  const [draft, setDraft] = useState<DraftShape | null>(null);
  const isDrawing = useRef(false);

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent>) {
    isDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos === undefined || pos === null) return;
    setDraft({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!isDrawing.current) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos === undefined || pos === null) return;
    setDraft((d) => (d === null ? null : { ...d, endX: pos.x, endY: pos.y }));
  }

  function handleMouseUp() {
    if (!isDrawing.current || draft === null) return;
    isDrawing.current = false;
    const newShape: DrawShape = {
      id: crypto.randomUUID(),
      type: activeTool,
      ...draft,
      strokeColor: DEFAULT_STROKE_COLOR,
    };
    const updated = [...shapes, newShape];
    setShapes(updated);
    onShapesChange(updated);
    setDraft(null);
  }

  function renderShape(shape: DrawShape, key: string) {
    if (shape.type === "rectangle") {
      return (
        <Rect
          key={key}
          x={Math.min(shape.startX, shape.endX)}
          y={Math.min(shape.startY, shape.endY)}
          width={Math.abs(shape.endX - shape.startX)}
          height={Math.abs(shape.endY - shape.startY)}
          stroke={shape.strokeColor}
          strokeWidth={2}
          fill="transparent"
        />
      );
    }
    return (
      <Line
        key={key}
        points={[shape.startX, shape.startY, shape.endX, shape.endY]}
        stroke={shape.strokeColor}
        strokeWidth={2}
      />
    );
  }

  const draftShape: DrawShape | null =
    draft === null
      ? null
      : { id: "draft", type: activeTool, ...draft, strokeColor: DEFAULT_STROKE_COLOR };

  return (
    <div
      className="absolute"
      style={{ left: region.x, top: region.y, width: region.width, height: region.height }}
    >
      <Stage
        ref={stageRef}
        width={region.width}
        height={region.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: "crosshair" }}
      >
        <Layer>
          {shapes.map((shape) => renderShape(shape, shape.id))}
          {draftShape !== null && renderShape(draftShape, "draft")}
        </Layer>
      </Stage>
    </div>
  );
}
