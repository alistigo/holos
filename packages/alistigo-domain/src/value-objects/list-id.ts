import { TypeID, typeid } from "typeid-js";

export type ListId = TypeID<"lst">;

export function generateListId(): ListId {
  return typeid("lst");
}

export function parseListId(str: string): ListId {
  return TypeID.fromString(str, "lst");
}
