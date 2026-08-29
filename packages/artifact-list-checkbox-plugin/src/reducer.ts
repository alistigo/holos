import type { AlistigoListElementCheckedRecord } from "@alistigo/list-document";

export function checkboxReducer(
  elementId: string,
  meta: Record<string, unknown>,
  event: unknown,
): Record<string, unknown> {
  const ev = event as {
    "alistigo:eventType"?: string;
    listItem?: { "@id"?: string };
    checked?: boolean;
  };
  if (ev["alistigo:eventType"] === "ListElementChecked" && ev["listItem"]?.["@id"] === elementId) {
    return { selected: (event as AlistigoListElementCheckedRecord).checked };
  }
  return meta;
}
