import { TypeID, typeid } from "typeid-js";

export type ActorId = TypeID<"act">;

export function generateActorId(): ActorId {
  return typeid("act");
}

export function parseActorId(str: string): ActorId {
  return TypeID.fromString(str, "act");
}
