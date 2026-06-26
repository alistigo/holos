import { TypeID, typeid } from "typeid-js";

export type ListEventId = TypeID<"lev">;

export function generateListEventId(): ListEventId {
  return typeid("lev");
}

export function parseListEventId(str: string): ListEventId {
  return TypeID.fromString(str, "lev");
}
