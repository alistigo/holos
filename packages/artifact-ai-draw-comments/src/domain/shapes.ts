import type { TypeID } from "typeid-js";
import { typeid } from "typeid-js";

export type DrawShapeId = TypeID<"dsh">;

export function generateDrawShapeId(): DrawShapeId {
  return typeid("dsh");
}

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
