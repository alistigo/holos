import type { AlistigoListElementCheckedRecord } from "@alistigo/list-document";
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
    list: { "@id": listId },
    listItem: { "@id": elementId },
    agent: actorId,
    startTime: new Date().toISOString(),
    checked,
  };
}
