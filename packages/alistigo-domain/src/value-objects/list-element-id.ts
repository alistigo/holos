import { TypeID, typeid } from "typeid-js";

export type ListElementId = TypeID<"lse">;

export function generateListElementId(): ListElementId {
  return typeid("lse");
}

export function parseListElementId(str: string): ListElementId {
  return TypeID.fromString(str, "lse");
}
