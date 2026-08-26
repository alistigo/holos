import type { AlistigoListElementCheckedRecord } from "@alistigo/list-document-format";
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
    "alistigo:actorId": actorId,
    "alistigo:timestamp": new Date().toISOString(),
    checked,
  };
}
