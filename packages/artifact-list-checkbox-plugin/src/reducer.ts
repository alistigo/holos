import type { AlistigoListElementCheckedRecord } from "@alistigo/list-document-format";

export function checkboxReducer(
  elementId: string,
  meta: Record<string, unknown>,
  event: unknown,
): Record<string, unknown> {
  const ev = event as {
    "alistigo:eventType"?: string;
    "alistigo:listElementId"?: string;
    checked?: boolean;
  };
  if (
    ev["alistigo:eventType"] === "ListElementChecked" &&
    ev["alistigo:listElementId"] === elementId
  ) {
    return { selected: (event as AlistigoListElementCheckedRecord).checked };
  }
  return meta;
}
