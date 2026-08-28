import type { AlistigoListElementCheckedRecord } from "@alistigo/list";
import { typeid } from "typeid-js";

export function createCheckListElementEvent(
  elementId: string,
  actorId: string,
  listId: string,
  checked: boolean,
): AlistigoListElementCheckedRecord {
  return {
    identifier: typeid("lev").toString(),
    "alistigo:eventType": "ListElementChecked",
    "alistigo:listId": listId,
    "alistigo:listElementId": elementId,
    agent: actorId,
    startTime: new Date().toISOString(),
    checked,
  };
}
