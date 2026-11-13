export interface DrawShape {
  id: string;
  type: "rectangle" | "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  strokeColor: string;
}

export const DEFAULT_STROKE_COLOR = "#ef4444";
