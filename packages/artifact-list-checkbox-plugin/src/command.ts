import type { AlistigoListElementCheckedRecord } from "@alistigo/list";
import { typeid } from "typeid-js";

export function createCheckListElementEvent(
  elementId: string,
  actorId: string,
  listId: string,
  checked: boolean,
): AlistigoListElementCheckedRecord {
  return {
    "alistigo:eventId": typeid("lev").toString(),
    "alistigo:eventType": "ListElementChecked",
    "alistigo:listId": listId,
    "alistigo:listElementId": elementId,
    "alistigo:agentId": actorId,
    "alistigo:timestamp": new Date().toISOString(),
    checked,
  };
}
